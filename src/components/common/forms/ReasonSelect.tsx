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

const DEFAULT_REASONS = [
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'LOST', label: 'Lost / Missing' },
  { value: 'FOUND', label: 'Found' },
  { value: 'CORRECTION', label: 'Inventory Correction' },
  { value: 'CYCLE_COUNT', label: 'Cycle Count Adjustment' },
  { value: 'RETURN', label: 'Customer Return' },
  { value: 'TRANSFER', label: 'Transfer Adjustment' },
  { value: 'QC_FAIL', label: 'Quality Control Fail' },
  { value: 'EXPIRY', label: 'Expired Stock' },
  { value: 'REWORK', label: 'Rework' },
  { value: 'OTHER', label: 'Other' },
]

interface ReasonSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  reasons?: Array<{ value: string; label: string }>
}

export function ReasonSelect<T extends FieldValues>({
  control,
  name,
  label = 'Reason',
  placeholder = 'Select reason',
  disabled,
  required,
  reasons = DEFAULT_REASONS,
}: ReasonSelectProps<T>) {
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
              {reasons.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
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
