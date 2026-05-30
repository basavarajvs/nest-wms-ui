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
import { useUsers } from '@/features/admin/users/data/user-queries'
import { Skeleton } from '@/components/ui/skeleton'

interface UserSelectProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function UserSelect<T extends FieldValues>({
  control,
  name,
  label = 'User',
  placeholder = 'Select user',
  disabled,
  required,
}: UserSelectProps<T>) {
  const { data, isLoading } = useUsers()
  const users = data?.users ?? []

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
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName && u.lastName
                    ? `${u.firstName} ${u.lastName} (${u.email})`
                    : u.email}
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
