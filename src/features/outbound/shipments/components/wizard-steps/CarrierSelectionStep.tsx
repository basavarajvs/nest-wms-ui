import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export interface WizardCarrierData {
  carrierId: string
  carrierCode: string
  carrierName: string
  serviceLevel: string
  rate: number
}

interface CarrierSelectionStepProps {
  data: WizardCarrierData
  onChange: (field: keyof WizardCarrierData, value: string) => void
}

const CARRIER_OPTIONS = [
  { value: 'fedex', code: 'FEDEX', name: 'FedEx' },
  { value: 'ups', code: 'UPS', name: 'UPS' },
  { value: 'usps', code: 'USPS', name: 'USPS' },
  { value: 'dhl', code: 'DHL', name: 'DHL' },
  { value: 'other', code: 'OTHER', name: 'Other Carrier' },
]

const SERVICE_LEVELS = [
  { value: 'STANDARD', label: 'Standard', baseRate: 5.0 },
  { value: 'EXPRESS', label: 'Express', baseRate: 12.0 },
  { value: 'OVERNIGHT', label: 'Overnight', baseRate: 25.0 },
  { value: 'ECONOMY', label: 'Economy', baseRate: 3.0 },
]

export function CarrierSelectionStep({ data, onChange }: CarrierSelectionStepProps) {
  const carrierOptions = useMemo(() => CARRIER_OPTIONS, [])

  const handleCarrierChange = (carrierId: string) => {
    const c = carrierOptions.find((opt) => opt.value === carrierId)
    onChange('carrierId', carrierId)
    onChange('carrierCode', c?.code || carrierId)
    onChange('carrierName', c?.name || carrierId)
  }

  const handleServiceChange = (service: string) => {
    onChange('serviceLevel', service)
    const svc = SERVICE_LEVELS.find((s) => s.value === service)
    if (svc) {
      onChange('rate', String(svc.baseRate))
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="carrierId">Carrier</Label>
        <Select value={data.carrierId} onValueChange={handleCarrierChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select carrier..." />
          </SelectTrigger>
          <SelectContent>
            {carrierOptions.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No carriers found
              </div>
            ) : (
              carrierOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.code} — {opt.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="serviceLevel">Service Level</Label>
        <Select value={data.serviceLevel} onValueChange={handleServiceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select service..." />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_LEVELS.map((sl) => (
              <SelectItem key={sl.value} value={sl.value}>
                {sl.label} — ${sl.baseRate.toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {data.rate > 0 && (
        <Card className="flex items-center justify-between p-3">
          <span className="text-sm text-muted-foreground">Estimated Rate</span>
          <span className="text-lg font-semibold">${data.rate.toFixed(2)}</span>
        </Card>
      )}
      <div className="grid gap-2">
        <Label htmlFor="rate">Override Rate ($)</Label>
        <Input
          id="rate"
          type="number"
          min={0}
          step={0.01}
          value={data.rate || ''}
          onChange={(e) => onChange('rate', e.target.value)}
          placeholder="0.00"
        />
      </div>
    </div>
  )
}
