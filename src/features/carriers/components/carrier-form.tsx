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
  createCarrierSchema,
  type CreateCarrierFormValues,
} from '@/features/carriers/schemas/carrier-schema'

interface CarrierFormProps {
  onSubmit: (values: CreateCarrierFormValues) => void
  defaultValues?: Partial<CreateCarrierFormValues>
  isSubmitting?: boolean
  disabledFields?: string[]
}

const defaultFormValues: CreateCarrierFormValues = {
  carrier_code: '',
  carrier_name: '',
  description: '',
  is_active: true,
}

export function CarrierForm({
  onSubmit,
  defaultValues,
  isSubmitting,
  disabledFields,
}: CarrierFormProps) {
  const disabledSet = new Set(disabledFields ?? [])
  const isDisabled = (name: string) => disabledSet.has(name) || !!isSubmitting
  const form = useForm<CreateCarrierFormValues>({
    resolver: zodResolver(createCarrierSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  })

  return (
    <Form {...form}>
      <form
        id="carrier-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="carrier_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. CARR-001" {...field} disabled={isDisabled('carrier_code')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="carrier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Carrier name" {...field} disabled={isDisabled('carrier_name')} />
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
                  placeholder="Carrier description"
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
