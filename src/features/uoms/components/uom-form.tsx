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
  createUomSchema,
  type CreateUomFormValues,
} from '@/features/uoms/schemas/uom-schema'

interface UomFormProps {
  onSubmit: (values: CreateUomFormValues) => void
  defaultValues?: Partial<CreateUomFormValues>
  isSubmitting?: boolean
}

const defaultFormValues: CreateUomFormValues = {
  uom_code: '',
  uom_name: '',
  description: '',
  is_active: true,
}

export function UomForm({
  onSubmit,
  defaultValues,
  isSubmitting,
}: UomFormProps) {
  const form = useForm<CreateUomFormValues>({
    resolver: zodResolver(createUomSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  })

  return (
    <Form {...form}>
      <form
        id="uom-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="uom_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. EA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="uom_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Unit of measure name" {...field} />
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
                  placeholder="UOM description"
                  className="resize-none"
                  rows={3}
                  {...field}
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
