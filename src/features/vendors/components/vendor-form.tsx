import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  createVendorSchema,
  type CreateVendorFormValues,
} from '@/features/vendors/schemas/vendor-schema'

interface VendorFormProps {
  onSubmit: (values: CreateVendorFormValues) => void
  defaultValues?: Partial<CreateVendorFormValues>
  isSubmitting?: boolean
  disabledFields?: string[]
}

const defaultFormValues: CreateVendorFormValues = {
  vendor_code: '',
  vendor_name: '',
  description: '',
  is_active: true,
}

export function VendorForm({
  onSubmit,
  defaultValues,
  isSubmitting,
  disabledFields,
}: VendorFormProps) {
  const disabledSet = new Set(disabledFields ?? [])
  const isDisabled = (name: string) => disabledSet.has(name) || !!isSubmitting
  const form = useForm<CreateVendorFormValues>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  })

  return (
    <Form {...form}>
      <form
        id="vendor-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vendor_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. VEN-001" {...field} disabled={isDisabled('vendor_code')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendor_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Vendor name" {...field} disabled={isDisabled('vendor_name')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Vendor description"
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={isDisabled('description')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-end gap-2 pb-1">
              <FormLabel className="pb-0">Active</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isDisabled('is_active')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
