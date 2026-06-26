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
  customerId: string
  orderType: string
  priority: string
  orderDate: string
  requestedDeliveryDate: string
  currencyCode: string
  totalOrderValue: string
  confirmedDate: string
  shippedDate: string
  deliveredDate: string
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

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
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
      <div className="grid gap-2">
        <Label htmlFor="customerId">Customer ID</Label>
        <Input
          id="customerId"
          value={data.customerId}
          onChange={(e) => onChange('customerId', e.target.value)}
          placeholder="Optional customer identifier"
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
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="orderDate">Order Date</Label>
          <Input
            id="orderDate"
            type="date"
            value={data.orderDate}
            onChange={(e) => onChange('orderDate', e.target.value)}
          />
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="currencyCode">Currency</Label>
          <Select
            value={data.currencyCode}
            onValueChange={(val) => onChange('currencyCode', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="totalOrderValue">Total Order Value</Label>
          <Input
            id="totalOrderValue"
            type="number"
            step="0.01"
            value={data.totalOrderValue}
            onChange={(e) => onChange('totalOrderValue', e.target.value)}
            placeholder="Auto-calculated"
            disabled
          />
        </div>
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
      <div className="rounded-md border p-3">
        <p className="mb-2 text-sm font-medium">Milestone Dates</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="confirmedDate">Confirmed Date</Label>
            <Input
              id="confirmedDate"
              type="date"
              value={data.confirmedDate}
              onChange={(e) => onChange('confirmedDate', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="shippedDate">Shipped Date</Label>
            <Input
              id="shippedDate"
              type="date"
              value={data.shippedDate}
              onChange={(e) => onChange('shippedDate', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deliveredDate">Delivered Date</Label>
            <Input
              id="deliveredDate"
              type="date"
              value={data.deliveredDate}
              onChange={(e) => onChange('deliveredDate', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
