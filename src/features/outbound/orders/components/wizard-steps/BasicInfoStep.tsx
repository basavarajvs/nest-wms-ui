import { useCallback } from 'react'
import { useFacility } from '@/hooks/useFacility'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientSelect } from '@/components/ClientSelect'
import { useClients } from '@/features/clients/data/client-queries'

export interface WizardOrderHeader {
  facilityId: string
  clientId: string
  clientCode: string
  clientName: string
  orderType: string
  priority: string
  requestedDeliveryDate: string
  deliveryAddress: string
  notes: string
}

interface BasicInfoStepProps {
  data: WizardOrderHeader
  onChange: (field: keyof WizardOrderHeader, value: string) => void
}

const ORDER_TYPE_OPTIONS = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'RUSH', label: 'Rush' },
  { value: 'REPLENISHMENT', label: 'Replenishment' },
  { value: 'TRANSFER', label: 'Transfer' },
]

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Lowest' },
  { value: '2', label: '2 - Low' },
  { value: '3', label: '3 - Normal' },
  { value: '4', label: '4 - High' },
  { value: '5', label: '5 - Critical' },
]

export function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const { selectedFacility } = useFacility()
  const { data: clientsData } = useClients()
  const clients = clientsData?.clients || []

  const handleClientChange = useCallback(
    (clientId: string) => {
      onChange('clientId', clientId)
      const client = clients.find((c) => c.id === clientId)
      if (client) {
        onChange('clientCode', client.clientCode)
        onChange('clientName', client.name)
      }
    },
    [clients, onChange]
  )

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
        <Label htmlFor="clientId">Client / Customer</Label>
        <ClientSelect
          value={data.clientId}
          onValueChange={handleClientChange}
          placeholder="Search client..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="orderType">Order Type</Label>
          <Select
            value={data.orderType}
            onValueChange={(val) => onChange('orderType', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={data.priority}
            onValueChange={(val) => onChange('priority', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="requestedDeliveryDate">Requested Delivery Date</Label>
        <Input
          id="requestedDeliveryDate"
          type="date"
          value={data.requestedDeliveryDate}
          onChange={(e) => onChange('requestedDeliveryDate', e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="deliveryAddress">Delivery Address</Label>
        <Textarea
          id="deliveryAddress"
          value={data.deliveryAddress}
          onChange={(e) => onChange('deliveryAddress', e.target.value)}
          rows={3}
          placeholder="Street, city, postal code..."
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
