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
import { createMaintenanceSchema, type CreateMaintenanceFormValues } from '@/features/equipment/data/equipment-schemas'
import { useCreateMaintenance } from '@/features/equipment/data/maintenance-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipmentId: string
  equipmentName: string
}

export function MaintenanceDialog({ open, onOpenChange, equipmentId, equipmentName }: Props) {
  const create = useCreateMaintenance()

  const form = useForm<CreateMaintenanceFormValues>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      maintenanceType: 'PREVENTIVE',
      priority: 'MEDIUM',
      description: '',
      notes: '',
      cost: undefined,
      downtimeMinutes: undefined,
      performedByUserId: '',
    },
  })

  const onSubmit = async (values: CreateMaintenanceFormValues) => {
    try {
      await create.mutateAsync({
        id: equipmentId,
        dto: { ...values, equipmentId, cost: values.cost ?? undefined, downtimeMinutes: values.downtimeMinutes ?? undefined },
      })
      toast.success('Maintenance record created')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create maintenance record')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Create Maintenance</DialogTitle>
          <DialogDescription>Record maintenance for {equipmentName}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='maintenanceType' render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='PREVENTIVE'>Preventive</SelectItem><SelectItem value='REPAIR'>Repair</SelectItem><SelectItem value='INSPECTION'>Inspection</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='priority' render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Select' /></SelectTrigger></FormControl><SelectContent><SelectItem value='LOW'>Low</SelectItem><SelectItem value='MEDIUM'>Medium</SelectItem><SelectItem value='HIGH'>High</SelectItem><SelectItem value='CRITICAL'>Critical</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='description' render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
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
              <Button type='submit' disabled={create.isPending}>
                {create.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
