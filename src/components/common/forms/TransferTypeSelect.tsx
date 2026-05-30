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

const TRANSFER_TYPES = [
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'INTER_FACILITY', label: 'Inter-Facility' },
  { value: 'RETURN', label: 'Return' },
  { value: 'CUSTOMER', label: 'Customer' },
]

interface TransferTypeSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function TransferTypeSelect<T extends FieldValues>({
  control,
  name,
  label = 'Transfer Type',
  placeholder = 'Select transfer type',
  disabled,
  required,
}: TransferTypeSelectProps<T>) {
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
              {TRANSFER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
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
