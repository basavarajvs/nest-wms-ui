import { type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface QuantityInputProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  min?: number
  max?: number
}

export function QuantityInput<T extends FieldValues>({
  control,
  name,
  label = 'Quantity',
  placeholder = '0',
  description,
  required,
  disabled,
  min = 0,
  max,
}: QuantityInputProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className='text-destructive'>*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type='number'
              placeholder={placeholder}
              disabled={disabled}
              min={min}
              max={max}
              className='font-mono'
              onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
