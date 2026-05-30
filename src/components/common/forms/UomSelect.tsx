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

const DEFAULT_UOMS = [
  { value: 'EA', label: 'Each (EA)' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'LB', label: 'Pound (LB)' },
  { value: 'PCS', label: 'Pieces (PCS)' },
  { value: 'BOX', label: 'Box (BOX)' },
  { value: 'PAL', label: 'Pallet (PAL)' },
  { value: 'CTN', label: 'Carton (CTN)' },
  { value: 'BAG', label: 'Bag (BAG)' },
  { value: 'DRM', label: 'Drum (DRM)' },
  { value: 'L', label: 'Liter (L)' },
  { value: 'M', label: 'Meter (M)' },
  { value: 'FT', label: 'Foot (FT)' },
]

interface UomSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function UomSelect<T extends FieldValues>({
  control,
  name,
  label = 'UOM',
  placeholder = 'Select unit of measure',
  disabled,
  required,
}: UomSelectProps<T>) {
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
              {DEFAULT_UOMS.map((uom) => (
                <SelectItem key={uom.value} value={uom.value}>
                  {uom.label}
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
