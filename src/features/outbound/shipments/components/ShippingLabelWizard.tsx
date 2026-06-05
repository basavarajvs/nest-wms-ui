import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { StepperDialog } from '@/components/wizard/StepperDialog'
import { useGenerateShippingLabel, usePrintLabel } from '../data/shipping-label-queries'
import type { ShippingLabelResponseDto } from '@/lib/types/wms-api'
import {
  ShipmentDetailsStep,
  type WizardShipmentData,
} from './wizard-steps/ShipmentDetailsStep'
import {
  CarrierSelectionStep,
  type WizardCarrierData,
} from './wizard-steps/CarrierSelectionStep'
import {
  LabelOptionsStep,
  type WizardLabelOptions,
} from './wizard-steps/LabelOptionsStep'
import { ReviewLabelStep } from './wizard-steps/ReviewLabelStep'
import type { Step } from '@/components/wizard/types'

const STEPS: Step[] = [
  { id: 'shipment-details', title: 'Shipment Details', description: 'Order, address, packaging' },
  { id: 'carrier-service', title: 'Carrier & Service', description: 'Select carrier and service level' },
  { id: 'label-options', title: 'Label Options', description: 'Format, copies, packing slip' },
  { id: 'review-print', title: 'Review & Print', description: 'Review and generate the label' },
]

function emptyShipmentData(): WizardShipmentData {
  return {
    orderId: '',
    orderNumber: '',
    destinationAddress: '',
    packagingType: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
  }
}

function emptyCarrierData(): WizardCarrierData {
  return {
    carrierId: '',
    carrierCode: '',
    carrierName: '',
    serviceLevel: '',
    rate: 0,
  }
}

function emptyLabelOptions(): WizardLabelOptions {
  return {
    labelFormat: '',
    copies: 1,
    includePackingSlip: false,
  }
}

interface ShippingLabelWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShippingLabelWizard({ open, onOpenChange }: ShippingLabelWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const generateLabel = useGenerateShippingLabel()
  const printLabel = usePrintLabel()
  const submittingRef = useRef(false)

  const [shipment, setShipment] = useState<WizardShipmentData>(emptyShipmentData)
  const [carrier, setCarrier] = useState<WizardCarrierData>(emptyCarrierData)
  const [label, setLabel] = useState<WizardLabelOptions>(emptyLabelOptions)
  const [generated, setGenerated] = useState(false)
  const [generatedLabelId, setGeneratedLabelId] = useState<string | undefined>()

  const handleShipmentChange = useCallback((field: keyof WizardShipmentData, value: string) => {
    setShipment((prev) => ({ ...prev, [field]: ['weight', 'length', 'width', 'height'].includes(field) ? Number(value) || 0 : value }))
  }, [])

  const handleCarrierChange = useCallback((field: keyof WizardCarrierData, value: string) => {
    setCarrier((prev) => ({ ...prev, [field]: field === 'rate' ? Number(value) || 0 : value }))
  }, [])

  const handleLabelChange = useCallback((field: keyof WizardLabelOptions, value: string | boolean) => {
    setLabel((prev) => ({ ...prev, [field]: value }))
  }, [])

  const resetAll = useCallback(() => {
    setCurrentStep(0)
    setShipment(emptyShipmentData())
    setCarrier(emptyCarrierData())
    setLabel(emptyLabelOptions())
    setGenerated(false)
    setGeneratedLabelId(undefined)
    submittingRef.current = false
  }, [])

  const handleClose = useCallback(() => {
    resetAll()
    onOpenChange(false)
  }, [onOpenChange, resetAll])

  const handleBeforeNext = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      if (stepIndex === 0) {
        if (!shipment.orderId) {
          toast.error('Please select an order.')
          return false
        }
        if (!shipment.packagingType) {
          toast.error('Please select a packaging type.')
          return false
        }
        return true
      }

      if (stepIndex === 1) {
        if (!carrier.carrierId) {
          toast.error('Please select a carrier.')
          return false
        }
        if (!carrier.serviceLevel) {
          toast.error('Please select a service level.')
          return false
        }
        return true
      }

      if (stepIndex === 2) {
        if (!label.labelFormat) {
          toast.error('Please select a label format.')
          return false
        }
        return true
      }

      return true
    },
    [shipment.orderId, shipment.packagingType, carrier.carrierId, carrier.serviceLevel, label.labelFormat]
  )

  const handleGenerate = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      const result = await generateLabel.mutateAsync({
        shipmentId: shipment.orderId,
        carrierCode: carrier.carrierCode || undefined,
        labelType: label.labelFormat,
        containerId: undefined,
      })
      const labelData = result as unknown as ShippingLabelResponseDto | undefined
      if (labelData?.id) {
        setGeneratedLabelId(labelData.id)
      }
      setGenerated(true)
      toast.success('Shipping label generated successfully')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate label')
    } finally {
      submittingRef.current = false
    }
  }, [shipment.orderId, carrier.carrierCode, label.labelFormat, generateLabel])

  const handlePrint = useCallback(async () => {
    if (!generatedLabelId) {
      toast.error('No label ID available for printing.')
      return
    }
    try {
      await printLabel.mutateAsync({ id: generatedLabelId, dto: { copies: label.copies } })
      toast.success(`Printing ${label.copies} copy/copies`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to print label')
    }
  }, [generatedLabelId, label.copies, printLabel])

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
      onComplete={handleClose}
      onCancel={handleClose}
      onBeforeNext={handleBeforeNext}
      title="Generate Shipping Label"
    >
      {currentStep === 0 && (
        <ShipmentDetailsStep data={shipment} onChange={handleShipmentChange} />
      )}
      {currentStep === 1 && (
        <CarrierSelectionStep data={carrier} onChange={handleCarrierChange} />
      )}
      {currentStep === 2 && (
        <LabelOptionsStep data={label} onChange={handleLabelChange} />
      )}
      {currentStep === 3 && (
        <ReviewLabelStep
          shipment={shipment}
          carrier={carrier}
          label={label}
          onGenerate={handleGenerate}
          onPrint={handlePrint}
          generating={generateLabel.isPending}
          printing={printLabel.isPending}
          generated={generated}
          generatedLabelId={generatedLabelId}
        />
      )}
    </StepperDialog>
  )
}
