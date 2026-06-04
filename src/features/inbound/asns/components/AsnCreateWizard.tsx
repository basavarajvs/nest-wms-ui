import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { StepperDialog } from '@/components/wizard/StepperDialog'
import { useFacility } from '@/hooks/useFacility'
import { useCreateAsn } from '../data/asn-queries'
import { useCreateAsnLine } from '../data/asn-line-queries'
import { BasicInfoStep, type WizardAsnHeader } from './wizard-steps/BasicInfoStep'
import { LineItemsStep, type WizardAsnLine } from './wizard-steps/LineItemsStep'
import { ReviewStep } from './wizard-steps/ReviewStep'
import type { Step } from '@/components/wizard/types'

const STEPS: Step[] = [
  { id: 'basic-info', title: 'Basic Info', description: 'Enter ASN header details' },
  { id: 'line-items', title: 'Line Items', description: 'Add products to this ASN' },
  { id: 'review', title: 'Review & Create', description: 'Review and submit the ASN' },
]

function generateTempId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function emptyHeader(facilityId: string): WizardAsnHeader {
  return {
    facilityId,
    vendorId: '',
    poNumber: '',
    carrierName: '',
    trackingNumber: '',
    expectedArrivalDate: '',
    notes: '',
  }
}

function emptyLine(): Omit<WizardAsnLine, 'tempId'> {
  return {
    productId: '',
    productName: '',
    productCode: '',
    expectedQuantity: 1,
    uomId: '',
    lotNumber: '',
    expiryDate: '',
  }
}

interface AsnCreateWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AsnCreateWizard({ open, onOpenChange }: AsnCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { selectedFacility } = useFacility()
  const createAsn = useCreateAsn()
  const createAsnLine = useCreateAsnLine()
  const submittingRef = useRef(false)

  const facilityId = selectedFacility?.id ?? ''

  const [header, setHeader] = useState<WizardAsnHeader>(() => emptyHeader(facilityId))
  const [lines, setLines] = useState<WizardAsnLine[]>([])

  const handleHeaderChange = useCallback((field: keyof WizardAsnHeader, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleAddLine = useCallback(() => {
    setLines((prev) => [...prev, { tempId: generateTempId(), ...emptyLine() }])
  }, [])

  const handleUpdateLine = useCallback((tempId: string, updates: Partial<WizardAsnLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.tempId === tempId ? { ...line, ...updates } : line))
    )
  }, [])

  const handleRemoveLine = useCallback((tempId: string) => {
    setLines((prev) => prev.filter((line) => line.tempId !== tempId))
  }, [])

  const resetAll = useCallback(() => {
    setCurrentStep(0)
    setHeader(emptyHeader(facilityId))
    setLines([])
    submittingRef.current = false
  }, [facilityId])

  const handleClose = useCallback(() => {
    resetAll()
    onOpenChange(false)
  }, [onOpenChange, resetAll])

  const handleBeforeNext = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      if (stepIndex === 0) {
        if (!facilityId) {
          toast.error('No facility selected. Please select a facility from the top bar.')
          return false
        }
        return true
      }

      if (stepIndex === 1) {
        if (lines.length === 0) {
          toast.error('Please add at least one line item.')
          return false
        }
        const invalidLines = lines.filter(
          (l) => !l.productId || !l.uomId || l.expectedQuantity < 1
        )
        if (invalidLines.length > 0) {
          toast.error('Each line item must have a product, quantity (min 1), and UOM.')
          return false
        }
        return true
      }

      return true
    },
    [facilityId, lines]
  )

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const res = await createAsn.mutateAsync({
        facilityId,
        vendorId: header.vendorId || undefined,
        poNumber: header.poNumber || undefined,
        carrierName: header.carrierName || undefined,
        trackingNumber: header.trackingNumber || undefined,
        expectedArrivalDate: header.expectedArrivalDate || undefined,
        notes: header.notes || undefined,
      })

      let asnId = ''
      if (res && typeof res === 'object') {
        const obj = res as Record<string, unknown>
        asnId = String(obj.id ?? '')
      }

      if (!asnId) {
        toast.error('ASN created but could not retrieve ID for line items.')
        handleClose()
        return
      }

      for (const line of lines) {
        await createAsnLine.mutateAsync({
          asnId,
          productId: line.productId,
          expectedQuantity: line.expectedQuantity,
          uomId: line.uomId,
          lotNumber: line.lotNumber || undefined,
          expiryDate: line.expiryDate || undefined,
        })
      }

      toast.success(`ASN created successfully with ${lines.length} line item(s)`)
      handleClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create ASN')
    } finally {
      submittingRef.current = false
    }
  }, [facilityId, header, lines, createAsn, createAsnLine, handleClose])

  return (
    <StepperDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose()
        else onOpenChange(val)
      }}
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={(step) => setCurrentStep(step as number)}
      onComplete={handleComplete}
      onCancel={handleClose}
      onBeforeNext={handleBeforeNext}
      title="Create ASN"
    >
      {currentStep === 0 && (
        <BasicInfoStep data={header} onChange={handleHeaderChange} />
      )}
      {currentStep === 1 && (
        <LineItemsStep
          lines={lines}
          onAddLine={handleAddLine}
          onUpdateLine={handleUpdateLine}
          onRemoveLine={handleRemoveLine}
        />
      )}
      {currentStep === 2 && (
        <ReviewStep header={header} lines={lines} />
      )}
    </StepperDialog>
  )
}
