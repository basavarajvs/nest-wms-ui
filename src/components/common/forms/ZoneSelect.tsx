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
import { useZones } from '@/features/warehouse/data/warehouse-queries'
import { Skeleton } from '@/components/ui/skeleton'

interface ZoneSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  facilityId?: string
}

export function ZoneSelect<T extends FieldValues>({
  control,
  name,
  label = 'Zone',
  placeholder = 'Select zone',
  disabled,
  required,
  facilityId,
}: ZoneSelectProps<T>) {
  const { data, isLoading } = useZones(facilityId)
  const zones = data?.zones ?? []

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
            disabled={disabled || isLoading || !facilityId}
          >
            <FormControl>
              <SelectTrigger>
                {isLoading ? (
                  <Skeleton className='h-4 w-24' />
                ) : !facilityId ? (
                  <span className='text-muted-foreground'>Select a facility first</span>
                ) : (
                  <SelectValue placeholder={placeholder} />
                )}
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.zoneCode} — {z.zoneName}
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
