import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { StepperDialog } from '@/components/wizard/StepperDialog'
import { useFacility } from '@/hooks/useFacility'
import { useCreateOrder } from '../data/order-queries'
import { useCreateOrderLine } from '../data/order-line-queries'
import { BasicInfoStep, type WizardOrderHeader } from './wizard-steps/BasicInfoStep'
import { LineItemsStep, type WizardOrderLine } from './wizard-steps/LineItemsStep'
import { ReviewStep } from './wizard-steps/ReviewStep'
import type { Step } from '@/components/wizard/types'

const STEPS: Step[] = [
  { id: 'basic-info', title: 'Basic Info', description: 'Enter order header details' },
  { id: 'line-items', title: 'Line Items', description: 'Add products to this order' },
  { id: 'review', title: 'Review & Create', description: 'Review and submit the order' },
]

function generateTempId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function emptyHeader(facilityId: string): WizardOrderHeader {
  return {
    clientId: '',
    clientCode: '',
    clientName: '',
    customerId: '',
    orderType: '',
    priority: '3',
    orderDate: '',
    requestedDeliveryDate: '',
    currencyCode: 'USD',
    totalOrderValue: '',
    confirmedDate: '',
    shippedDate: '',
    deliveredDate: '',
    deliveryAddress: '',
    notes: '',
    facilityId,
  }
}

function emptyLine(): Omit<WizardOrderLine, 'tempId'> {
  return {
    productId: '',
    productName: '',
    productCode: '',
    quantity: 1,
    uomId: '',
    unitPrice: 0,
  }
}

interface SalesOrderCreateWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesOrderCreateWizard({ open, onOpenChange }: SalesOrderCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { selectedFacility } = useFacility()
  const createOrder = useCreateOrder()
  const createOrderLine = useCreateOrderLine()
  const submittingRef = useRef(false)

  const facilityId = selectedFacility?.id ?? ''

  const [header, setHeader] = useState<WizardOrderHeader>(() => emptyHeader(facilityId))
  const [lines, setLines] = useState<WizardOrderLine[]>([])

  const handleHeaderChange = useCallback((field: keyof WizardOrderHeader, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleAddLine = useCallback(() => {
    setLines((prev) => [...prev, { tempId: generateTempId(), ...emptyLine() }])
  }, [])

  const handleUpdateLine = useCallback((tempId: string, updates: Partial<WizardOrderLine>) => {
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
        if (!header.clientId) {
          toast.error('Please select a client.')
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
          (l) => !l.productId || !l.uomId || l.quantity < 1
        )
        if (invalidLines.length > 0) {
          toast.error('Each line item must have a product, quantity (min 1), and UOM.')
          return false
        }
        return true
      }

      return true
    },
    [facilityId, header.clientId, lines]
  )

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const res = await createOrder.mutateAsync({
        facilityId,
        clientCode: header.clientCode,
        customerId: header.customerId || undefined,
        orderType: header.orderType || undefined,
        priority: header.priority ? parseInt(header.priority, 10) : undefined,
        orderDate: header.orderDate || undefined,
        requestedDeliveryDate: header.requestedDeliveryDate || undefined,
        currencyCode: header.currencyCode || undefined,
        totalOrderValue: header.totalOrderValue ? parseFloat(header.totalOrderValue) : undefined,
        confirmedDate: header.confirmedDate || undefined,
        shippedDate: header.shippedDate || undefined,
        deliveredDate: header.deliveredDate || undefined,
        deliveryAddress: header.deliveryAddress ? { address: header.deliveryAddress } : undefined,
        notes: header.notes || undefined,
      } as any)

      let orderId = ''
      if (res && typeof res === 'object') {
        const obj = res as Record<string, unknown>
        orderId = String(obj.id ?? '')
      }

      if (!orderId) {
        toast.error('Order created but could not retrieve ID for line items.')
        handleClose()
        return
      }

      for (const line of lines) {
        await createOrderLine.mutateAsync({
          orderId,
          productId: line.productId,
          quantity: line.quantity,
          uomId: line.uomId,
          unitPrice: line.unitPrice || undefined,
        })
      }

      toast.success(`Order created successfully with ${lines.length} line item(s)`)
      handleClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create order')
    } finally {
      submittingRef.current = false
    }
  }, [facilityId, header, lines, createOrder, createOrderLine, handleClose])

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
      title="Create Sales Order"
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
