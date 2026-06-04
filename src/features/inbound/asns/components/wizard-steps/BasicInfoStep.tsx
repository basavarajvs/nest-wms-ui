import { useFacility } from '@/hooks/useFacility'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { VendorSelect } from '@/components/VendorSelect'

export interface WizardAsnHeader {
  facilityId: string
  vendorId: string
  poNumber: string
  carrierName: string
  trackingNumber: string
  expectedArrivalDate: string
  notes: string
}

interface BasicInfoStepProps {
  data: WizardAsnHeader
  onChange: (field: keyof WizardAsnHeader, value: string) => void
  errors?: Partial<Record<keyof WizardAsnHeader, string>>
}

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const { selectedFacility } = useFacility()

  return (
    <div className="grid gap-4">
      {selectedFacility && (
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Facility:{' '}
          <span className="font-medium text-foreground">
            {selectedFacility.facilityCode} — {selectedFacility.facilityName}
          </span>
        </div>
      )}
      {!selectedFacility && (
        <p className="text-sm text-destructive">
          No facility selected. Please select a facility from the top bar.
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="vendorId">Vendor</Label>
        <VendorSelect
          value={data.vendorId}
          onValueChange={(val) => onChange('vendorId', val)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="poNumber">PO Number</Label>
        <Input
          id="poNumber"
          value={data.poNumber}
          onChange={(e) => onChange('poNumber', e.target.value)}
          placeholder="e.g. PO-001"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="carrierName">Carrier</Label>
          <Input
            id="carrierName"
            value={data.carrierName}
            onChange={(e) => onChange('carrierName', e.target.value)}
            placeholder="e.g. FedEx"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="trackingNumber">Tracking #</Label>
          <Input
            id="trackingNumber"
            value={data.trackingNumber}
            onChange={(e) => onChange('trackingNumber', e.target.value)}
            placeholder="Tracking number"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expectedArrivalDate">Expected Arrival Date</Label>
        <Input
          id="expectedArrivalDate"
          type="date"
          value={data.expectedArrivalDate}
          onChange={(e) => onChange('expectedArrivalDate', e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          rows={3}
          placeholder="Additional notes..."
        />
      </div>
    </div>
  )
}
