import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { componentSchema, type ComponentFormValues } from '@/features/work-orders/data/work-order-schemas'
import { useAddComponent } from '@/features/work-orders/data/work-order-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrderId: string
}

export function ComponentDialog({ open, onOpenChange, workOrderId }: Props) {
  const add = useAddComponent()

  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      productId: '',
      lotId: '',
      quantityRequired: 1,
      uomId: 'EA',
      notes: '',
    },
  })

  const onSubmit = async (values: ComponentFormValues) => {
    try {
      await add.mutateAsync({ id: workOrderId, dto: { ...values, lotId: values.lotId || undefined } })
      toast.success('Component added')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add component')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
          <DialogDescription>Add a component/product to the work order</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='productId' render={({ field }) => (
                <FormItem><FormLabel>Product ID *</FormLabel><FormControl><Input {...field} placeholder='Product ID' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='lotId' render={({ field }) => (
                <FormItem><FormLabel>Lot ID</FormLabel><FormControl><Input {...field} placeholder='Optional' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='quantityRequired' render={({ field }) => (
                <FormItem><FormLabel>Qty Required *</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='uomId' render={({ field }) => (
                <FormItem><FormLabel>UOM *</FormLabel><FormControl><Input {...field} placeholder='e.g. EA' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={add.isPending}>
                {add.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Add Component
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
