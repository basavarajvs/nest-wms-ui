import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const REPORT_TYPES = [
  { value: 'INVENTORY_SUMMARY', label: 'Inventory Summary' },
  { value: 'STOCK_LEVEL', label: 'Stock Level Report' },
  { value: 'TRANSACTION_LOG', label: 'Transaction Log' },
  { value: 'CYCLE_COUNT', label: 'Cycle Count Report' },
  { value: 'ORDER_FULFILLMENT', label: 'Order Fulfillment' },
  { value: 'RECEIVING', label: 'Receiving Report' },
  { value: 'SHIPPING', label: 'Shipping Report' },
  { value: 'PUTAWAY', label: 'Putaway Performance' },
  { value: 'PICKING', label: 'Picking Performance' },
  { value: 'AUDIT_TRAIL', label: 'Audit Trail' },
]

interface ReportTypeSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function ReportTypeSelect<T extends FieldValues>({
  control,
  name,
  label = 'Report Type',
  placeholder = 'Select report type',
  disabled,
  required,
}: ReportTypeSelectProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className='text-destructive'>*</span>}
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value ?? ''}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {REPORT_TYPES.map((rt) => (
                <SelectItem key={rt.value} value={rt.value}>
                  {rt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
