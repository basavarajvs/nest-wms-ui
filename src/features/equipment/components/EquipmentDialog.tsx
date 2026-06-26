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
import { createEquipmentSchema, type CreateEquipmentFormValues } from '@/features/equipment/data/equipment-schemas'
import { useCreateEquipment, useUpdateEquipment, type EquipmentItem } from '@/features/equipment/data/equipment-queries'
import { useFacility } from '@/hooks/useFacility'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  equipment?: EquipmentItem | null
}

export function EquipmentDialog({ open, onOpenChange, equipment }: Props) {
  const { currentFacility } = useFacility()
  const create = useCreateEquipment()
  const update = useUpdateEquipment()
  const isEdit = !!equipment

  const form = useForm<CreateEquipmentFormValues>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      equipmentCode: equipment?.equipmentCode || '',
      equipmentName: equipment?.equipmentName || '',
      equipmentType: (equipment?.equipmentType as any) || 'FORKLIFT',
      locationId: equipment?.locationId || '',
      serialNumber: equipment?.serialNumber || '',
      manufacturer: equipment?.manufacturer || '',
      model: equipment?.model || '',
      year: equipment?.year || undefined,
      notes: equipment?.notes || '',
    },
  })

  const onSubmit = async (values: CreateEquipmentFormValues) => {
    try {
      if (isEdit && equipment) {
        const { equipmentCode, equipmentType, ...rest } = values
        await update.mutateAsync({ id: equipment.id, dto: { ...rest, year: values.year ?? undefined } })
        toast.success('Equipment updated')
      } else {
        await create.mutateAsync({ ...values, facilityId: currentFacility?.id || '', year: values.year ?? undefined })
        toast.success('Equipment created')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEdit ? 'update' : 'create'} equipment`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Equipment' : 'Register Equipment'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update equipment details' : 'Add new equipment to the registry'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='equipmentCode' render={({ field }) => (
                <FormItem><FormLabel>Code *</FormLabel><FormControl><Input {...field} placeholder='e.g. FL-001' disabled={isEdit} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='equipmentName' render={({ field }) => (
                <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder='e.g. Forklift A' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='equipmentType' render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='FORKLIFT'>Forklift</SelectItem><SelectItem value='PALLET_JACK'>Pallet Jack</SelectItem><SelectItem value='HAND_TRUCK'>Hand Truck</SelectItem><SelectItem value='CONVEYOR'>Conveyor</SelectItem><SelectItem value='SCANNER'>Scanner</SelectItem><SelectItem value='PRINTER'>Printer</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='locationId' render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='serialNumber' render={({ field }) => (
                <FormItem><FormLabel>Serial #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='year' render={({ field }) => (
                <FormItem><FormLabel>Year</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='manufacturer' render={({ field }) => (
                <FormItem><FormLabel>Manufacturer</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='model' render={({ field }) => (
                <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
