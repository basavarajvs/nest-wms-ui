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

interface LotNumberInputProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
}

export function LotNumberInput<T extends FieldValues>({
  control,
  name,
  label = 'Lot / Batch Number',
  placeholder = 'e.g. LOT-2024-001',
  description,
  required,
  disabled,
}: LotNumberInputProps<T>) {
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
              placeholder={placeholder}
              disabled={disabled}
              className='font-mono'
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
