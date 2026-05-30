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

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Lowest' },
  { value: '2', label: '2 - Low' },
  { value: '3', label: '3 - Normal' },
  { value: '4', label: '4 - High' },
  { value: '5', label: '5 - Critical' },
]

interface PrioritySelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  includeLabel?: boolean
}

export function PrioritySelect<T extends FieldValues>({
  control,
  name,
  label = 'Priority',
  placeholder = 'Select priority',
  disabled,
  required,
}: PrioritySelectProps<T>) {
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
            value={field.value != null ? String(field.value) : ''}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
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
