import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Printer, CheckCircle2 } from 'lucide-react'
import type { WizardShipmentData } from './ShipmentDetailsStep'
import type { WizardCarrierData } from './CarrierSelectionStep'
import type { WizardLabelOptions } from './LabelOptionsStep'

interface ReviewLabelStepProps {
  shipment: WizardShipmentData
  carrier: WizardCarrierData
  label: WizardLabelOptions
  onGenerate: () => void
  onPrint: () => void
  generating: boolean
  printing: boolean
  generated: boolean
  generatedLabelId?: string
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '-'}</p>
    </div>
  )
}

export function ReviewLabelStep({
  shipment,
  carrier,
  label,
  onGenerate,
  onPrint,
  generating,
  printing,
  generated,
}: ReviewLabelStepProps) {
  const dimensions = useMemo(() => {
    const parts: string[] = []
    if (shipment.length > 0) parts.push(`${shipment.length}cm`)
    if (shipment.width > 0) parts.push(`${shipment.width}cm`)
    if (shipment.height > 0) parts.push(`${shipment.height}cm`)
    return parts.join(' × ') || '-'
  }, [shipment])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Shipment Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Order" value={shipment.orderNumber} />
          <InfoCard label="Packaging" value={shipment.packagingType} />
          <InfoCard label="Weight" value={shipment.weight > 0 ? `${shipment.weight} kg` : '-'} />
          <InfoCard label="Dimensions" value={dimensions} />
        </div>
        {shipment.destinationAddress && (
          <div className="mt-3 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Destination Address</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm">{shipment.destinationAddress}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Carrier & Service</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Carrier" value={carrier.carrierName} />
          <InfoCard label="Service Level" value={carrier.serviceLevel} />
          <InfoCard label="Rate" value={carrier.rate > 0 ? `$${carrier.rate.toFixed(2)}` : '-'} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Label Options</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Format" value={label.labelFormat} />
          <InfoCard label="Copies" value={String(label.copies)} />
          <InfoCard label="Packing Slip" value={label.includePackingSlip ? 'Yes' : 'No'} />
        </div>
      </div>

      <Card className="flex flex-col items-center gap-4 p-6">
        {generated ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">Label generated successfully</p>
            <p className="text-xs text-muted-foreground">You can now print the label or close the wizard.</p>
            <Button onClick={onPrint} disabled={printing}>
              {printing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Print Label ({label.copies} copy/copies)
            </Button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground">
              Review all details above, then generate the shipping label.
            </p>
            <Button onClick={onGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Generate Label
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
