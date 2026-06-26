import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createServiceSchema, updateServiceSchema, type CreateServiceFormValues, type UpdateServiceFormValues } from '@/features/vas-catalog/data/vas-catalog-schemas'
import { useCreateVasService, useUpdateVasService, type VasService } from '@/features/vas-catalog/data/vas-catalog-queries'

const CATEGORIES = [
  { value: 'KITTING', label: 'Kitting' },
  { value: 'LABELING', label: 'Labeling' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'ASSEMBLY', label: 'Assembly' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'REPACK', label: 'Repack' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editService?: VasService
}

export function ServiceDialog({ open, onOpenChange, editService }: Props) {
  const createService = useCreateVasService()
  const updateService = useUpdateVasService()
  const isEditing = !!editService

  const defaultValues = useMemo(() => {
    if (editService) {
      return {
        serviceName: editService.serviceName,
        category: editService.category,
        description: editService.description || '',
        defaultRate: editService.defaultRate ?? undefined,
        uomId: editService.uomId || '',
        estimatedTimeMinutes: editService.estimatedTimeMinutes ?? undefined,
        isActive: editService.isActive,
      } satisfies UpdateServiceFormValues
    }
    return {
      serviceCode: '',
      serviceName: '',
      category: 'KITTING' as const,
      description: '',
      defaultRate: undefined,
      uomId: '',
      estimatedTimeMinutes: undefined,
      isActive: true,
    } satisfies CreateServiceFormValues
  }, [editService])

  const form = useForm<CreateServiceFormValues | UpdateServiceFormValues>({
    resolver: zodResolver(isEditing ? updateServiceSchema : createServiceSchema),
    defaultValues: defaultValues as any,
  })

  useEffect(() => {
    form.reset(defaultValues as any)
  }, [form, defaultValues])

  const onSubmit = async (values: CreateServiceFormValues | UpdateServiceFormValues) => {
    try {
      if (isEditing && editService) {
        await updateService.mutateAsync({
          id: editService.id,
          dto: values as any,
        })
        toast.success('Service updated')
      } else {
        await createService.mutateAsync(values as any)
        toast.success('Service created')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save service')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Service' : 'Create Service'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the VAS service details' : 'Add a new VAS service to the catalog'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {!isEditing && (
              <FormField
                control={form.control}
                name='serviceCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. KIT-A' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name='serviceName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g. Standard Kitting' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='defaultRate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Rate</FormLabel>
                    <FormControl>
                      <Input type='number' step='any' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='uomId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UOM</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. EA' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='estimatedTimeMinutes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Time (min)</FormLabel>
                  <FormControl>
                    <Input type='number' {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-2'>
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className='!mt-0'>Active</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={createService.isPending || updateService.isPending}>
                {(createService.isPending || updateService.isPending) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
