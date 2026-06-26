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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { changeStatusSchema, type ChangeStatusFormValues } from '@/features/equipment/data/equipment-schemas'
import { useChangeEquipmentStatus } from '@/features/equipment/data/equipment-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId: string
  currentStatus: string
}

const TRANSITIONS: Record<string, string[]> = {
  AVAILABLE: ['IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'],
  IN_USE: ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'],
  MAINTENANCE: ['AVAILABLE', 'OUT_OF_SERVICE'],
  OUT_OF_SERVICE: ['AVAILABLE', 'MAINTENANCE', 'DECOMMISSIONED'],
  DECOMMISSIONED: [],
}

export function ChangeStatusDialog({ open, onOpenChange, equipmentId, currentStatus }: Props) {
  const changeStatus = useChangeEquipmentStatus()
  const allowedStatuses = TRANSITIONS[currentStatus] || []

  const form = useForm<ChangeStatusFormValues>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: { status: allowedStatuses[0] || 'AVAILABLE', notes: '' },
  })

  const onSubmit = async (values: ChangeStatusFormValues) => {
    try {
      await changeStatus.mutateAsync({ id: equipmentId, dto: { status: values.status, notes: values.notes || undefined } })
      toast.success('Status changed')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change status')
    }
  }

  if (allowedStatuses.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>Current: {currentStatus}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='status' render={({ field }) => (
              <FormItem><FormLabel>New Status *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{allowedStatuses.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={changeStatus.isPending}>
                {changeStatus.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Change
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
