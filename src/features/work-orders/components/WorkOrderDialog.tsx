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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWorkOrderSchema, type CreateWorkOrderFormValues } from '@/features/work-orders/data/work-order-schemas'
import { useCreateWorkOrder, useUpdateWorkOrder, type WorkOrder } from '@/features/work-orders/data/work-order-queries'
import { useFacility } from '@/hooks/useFacility'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrder?: WorkOrder | null
}

export function WorkOrderDialog({ open, onOpenChange, workOrder }: Props) {
  const { currentFacility } = useFacility()
  const create = useCreateWorkOrder()
  const update = useUpdateWorkOrder()
  const isEdit = !!workOrder

  const form = useForm<CreateWorkOrderFormValues>({
    resolver: zodResolver(createWorkOrderSchema),
    defaultValues: {
      workOrderType: (workOrder?.workOrderType as any) || 'ASSEMBLY',
      priority: (workOrder?.priority as any) || 'MEDIUM',
      productId: workOrder?.productId || '',
      quantity: workOrder?.quantity || undefined,
      uomId: workOrder?.uomId || '',
      clientId: workOrder?.clientId || '',
      assignedToUserId: workOrder?.assignedToUserId || '',
      scheduledDate: workOrder?.scheduledDate || '',
      notes: workOrder?.notes || '',
    },
  })

  const onSubmit = async (values: CreateWorkOrderFormValues) => {
    try {
      if (isEdit && workOrder) {
        await update.mutateAsync({ id: workOrder.id, dto: { ...values } as any })
        toast.success('Work order updated')
      } else {
        await create.mutateAsync({ ...values, facilityId: currentFacility?.id || '' } as any)
        toast.success('Work order created')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEdit ? 'update' : 'create'} work order`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[540px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Work Order' : 'Create Work Order'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update work order details' : 'Create a new work order'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='workOrderType' render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='ASSEMBLY'>Assembly</SelectItem><SelectItem value='DISASSEMBLY'>Disassembly</SelectItem><SelectItem value='KITTING'>Kitting</SelectItem><SelectItem value='REPAIR'>Repair</SelectItem><SelectItem value='CUSTOM'>Custom</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='priority' render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Select' /></SelectTrigger></FormControl><SelectContent><SelectItem value='LOW'>Low</SelectItem><SelectItem value='MEDIUM'>Medium</SelectItem><SelectItem value='HIGH'>High</SelectItem><SelectItem value='URGENT'>Urgent</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <FormField control={form.control} name='productId' render={({ field }) => (
                <FormItem><FormLabel>Product</FormLabel><FormControl><Input {...field} placeholder='Product ID' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='quantity' render={({ field }) => (
                <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='uomId' render={({ field }) => (
                <FormItem><FormLabel>UOM</FormLabel><FormControl><Input {...field} placeholder='e.g. EA' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='clientId' render={({ field }) => (
                <FormItem><FormLabel>Client</FormLabel><FormControl><Input {...field} placeholder='Client ID' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='assignedToUserId' render={({ field }) => (
                <FormItem><FormLabel>Assigned To</FormLabel><FormControl><Input {...field} placeholder='User ID' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='scheduledDate' render={({ field }) => (
              <FormItem><FormLabel>Scheduled Date</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={create.isPending || update.isPending}>
                {(create.isPending || update.isPending) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
