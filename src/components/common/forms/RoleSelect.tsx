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
import { useRoles } from '@/features/admin/users/data/user-queries'
import { Skeleton } from '@/components/ui/skeleton'

interface RoleSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function RoleSelect<T extends FieldValues>({
  control,
  name,
  label = 'Role',
  placeholder = 'Select role',
  disabled,
  required,
}: RoleSelectProps<T>) {
  const { data: roles, isLoading } = useRoles()

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
              {(roles ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name || r.code || r.id}
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
