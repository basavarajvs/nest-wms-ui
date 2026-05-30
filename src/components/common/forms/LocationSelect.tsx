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
import { useLocations } from '@/features/warehouse/data/warehouse-queries'
import { Skeleton } from '@/components/ui/skeleton'

interface LocationSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function LocationSelect<T extends FieldValues>({
  control,
  name,
  label = 'Location',
  placeholder = 'Select location',
  disabled,
  required,
}: LocationSelectProps<T>) {
  const { data, isLoading } = useLocations()
  const locations = data?.locations ?? []

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
            disabled={disabled || isLoading}
          >
            <FormControl>
              <SelectTrigger>
                {isLoading ? (
                  <Skeleton className='h-4 w-24' />
                ) : (
                  <SelectValue placeholder={placeholder} />
                )}
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.locationCode}{l.locationName ? ` — ${l.locationName}` : ''}
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
