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

const VELOCITY_CLASSES = [
  { value: 'A', label: 'A - Fast Moving' },
  { value: 'B', label: 'B - Medium Moving' },
  { value: 'C', label: 'C - Slow Moving' },
  { value: 'D', label: 'D - Non Moving' },
]

interface VelocityClassSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function VelocityClassSelect<T extends FieldValues>({
  control,
  name,
  label = 'Velocity Class',
  placeholder = 'Select velocity class',
  disabled,
  required,
}: VelocityClassSelectProps<T>) {
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
              {VELOCITY_CLASSES.map((vc) => (
                <SelectItem key={vc.value} value={vc.value}>
                  {vc.label}
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
