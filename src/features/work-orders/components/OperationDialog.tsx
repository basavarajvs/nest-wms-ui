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
import { operationSchema, type OperationFormValues } from '@/features/work-orders/data/work-order-schemas'
import { useAddOperation, useUpdateOperation, type WorkOrderOperation } from '@/features/work-orders/data/work-order-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  workOrderId: string
  operation?: WorkOrderOperation | null
}

export function OperationDialog({ open, onOpenChange, workOrderId, operation }: Props) {
  const add = useAddOperation()
  const update = useUpdateOperation()
  const isEdit = !!operation

  const form = useForm<OperationFormValues>({
    resolver: zodResolver(operationSchema),
    defaultValues: {
      sequenceNumber: operation?.sequenceNumber || 1,
      operationName: operation?.operationName || '',
      operationType: (operation?.operationType as any) || 'TASK',
      assignedToUserId: operation?.assignedToUserId || '',
      estimatedMinutes: operation?.estimatedMinutes || undefined,
      notes: operation?.notes || '',
    },
  })

  const onSubmit = async (values: OperationFormValues) => {
    try {
      if (isEdit && operation) {
        await update.mutateAsync({ id: workOrderId, opId: operation.id, dto: { status: 'COMPLETED' as any } })
        toast.success('Operation updated')
      } else {
        await add.mutateAsync({ id: workOrderId, dto: values })
        toast.success('Operation added')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEdit ? 'update' : 'add'} operation`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Update Operation' : 'Add Operation'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update operation status' : 'Add a new operation to the work order'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='sequenceNumber' render={({ field }) => (
                <FormItem><FormLabel>Sequence *</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='operationType' render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='TASK'>Task</SelectItem><SelectItem value='QUALITY_CHECK'>Quality Check</SelectItem><SelectItem value='MOVE'>Move</SelectItem><SelectItem value='LABEL'>Label</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='operationName' render={({ field }) => (
              <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder='e.g. Inspect components' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='assignedToUserId' render={({ field }) => (
                <FormItem><FormLabel>Assigned To</FormLabel><FormControl><Input {...field} placeholder='User ID' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='estimatedMinutes' render={({ field }) => (
                <FormItem><FormLabel>Est. Minutes</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={add.isPending || update.isPending}>
                {(add.isPending || update.isPending) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEdit ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
