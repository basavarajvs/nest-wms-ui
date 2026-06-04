import { useMemo } from 'react'
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
import { useOrders } from '@/features/outbound/orders/data/order-queries'

export interface WizardShipmentData {
  orderId: string
  orderNumber: string
  destinationAddress: string
  packagingType: string
  weight: number
  length: number
  width: number
  height: number
}

interface ShipmentDetailsStepProps {
  data: WizardShipmentData
  onChange: (field: keyof WizardShipmentData, value: string) => void
}

const PACKAGING_TYPES = [
  { value: 'BOX', label: 'Box' },
  { value: 'ENVELOPE', label: 'Envelope' },
  { value: 'PALLET', label: 'Pallet' },
]

export function ShipmentDetailsStep({ data, onChange }: ShipmentDetailsStepProps) {
  const { data: ordersData } = useOrders({ page: 1, limit: 100, status: '', clientCode: '' })
  const orders = ordersData?.orders || []

  const orderOptions = useMemo(
    () =>
      orders.map((o) => ({
        value: o.id,
        label: `${o.orderNumber || o.id.substring(0, 12)} — ${o.clientCode || 'N/A'}`,
      })),
    [orders]
  )

  const handleOrderChange = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    onChange('orderId', orderId)
    onChange('orderNumber', order?.orderNumber || orderId)
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="orderId">Order</Label>
        <Select value={data.orderId} onValueChange={handleOrderChange}>
          <SelectTrigger>
            <SelectValue placeholder="Search/select order..." />
          </SelectTrigger>
          <SelectContent>
            {orderOptions.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No orders found
              </div>
            ) : (
              orderOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="destinationAddress">Destination Address</Label>
        <Textarea
          id="destinationAddress"
          value={data.destinationAddress}
          onChange={(e) => onChange('destinationAddress', e.target.value)}
          rows={3}
          placeholder="Street, city, state, postal code, country"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="packagingType">Packaging Type</Label>
        <Select
          value={data.packagingType}
          onValueChange={(val) => onChange('packagingType', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select packaging..." />
          </SelectTrigger>
          <SelectContent>
            {PACKAGING_TYPES.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          min={0}
          step={0.1}
          value={data.weight || ''}
          onChange={(e) => onChange('weight', e.target.value)}
          placeholder="0.0"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="length">Length (cm)</Label>
          <Input
            id="length"
            type="number"
            min={0}
            value={data.length || ''}
            onChange={(e) => onChange('length', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="width">Width (cm)</Label>
          <Input
            id="width"
            type="number"
            min={0}
            value={data.width || ''}
            onChange={(e) => onChange('width', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            min={0}
            value={data.height || ''}
            onChange={(e) => onChange('height', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
