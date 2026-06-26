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
import { completeMaintenanceSchema, type CompleteMaintenanceFormValues } from '@/features/equipment/data/equipment-schemas'
import { useCompleteMaintenance } from '@/features/equipment/data/maintenance-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  maintenanceId: string
}

export function CompleteMaintenanceDialog({ open, onOpenChange, maintenanceId }: Props) {
  const complete = useCompleteMaintenance()

  const form = useForm<CompleteMaintenanceFormValues>({
    resolver: zodResolver(completeMaintenanceSchema),
    defaultValues: { cost: undefined, downtimeMinutes: undefined, notes: '', performedByUserId: '' },
  })

  const onSubmit = async (values: CompleteMaintenanceFormValues) => {
    try {
      await complete.mutateAsync({
        id: maintenanceId,
        dto: {
          cost: values.cost ?? undefined,
          downtimeMinutes: values.downtimeMinutes ?? undefined,
          notes: values.notes || undefined,
          performedByUserId: values.performedByUserId || undefined,
        },
      })
      toast.success('Maintenance completed')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to complete maintenance')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Complete Maintenance</DialogTitle>
          <DialogDescription>Mark the maintenance record as completed</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='cost' render={({ field }) => (
                <FormItem><FormLabel>Cost</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='downtimeMinutes' render={({ field }) => (
                <FormItem><FormLabel>Downtime (min)</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='performedByUserId' render={({ field }) => (
              <FormItem><FormLabel>Performed By</FormLabel><FormControl><Input {...field} placeholder='User ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={complete.isPending}>
                {complete.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Complete
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
