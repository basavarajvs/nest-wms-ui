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
import { useCreateShift, useUpdateShift, type LaborShift } from '@/features/labor/shifts/data/shift-queries'
import { useFacility } from '@/hooks/useFacility'
import * as z from 'zod'

const shiftSchema = z.object({
  shiftCode: z.string().min(1, 'Required'),
  shiftName: z.string().min(1, 'Required'),
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  timezone: z.string().optional(),
})

type FormValues = z.infer<typeof shiftSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift?: LaborShift | null
}

export function ShiftDialog({ open, onOpenChange, shift }: Props) {
  const { currentFacility } = useFacility()
  const create = useCreateShift()
  const update = useUpdateShift()
  const isEdit = !!shift

  const form = useForm<FormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      shiftCode: shift?.shiftCode || '',
      shiftName: shift?.shiftName || '',
      startTime: shift?.startTime || '',
      endTime: shift?.endTime || '',
      timezone: shift?.timezone || '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && shift) {
        await update.mutateAsync({ id: shift.id, dto: { ...values, isActive: shift.isActive } })
        toast.success('Shift updated')
      } else {
        await create.mutateAsync({ ...values, facilityId: currentFacility?.id || '' })
        toast.success('Shift created')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEdit ? 'update' : 'create'} shift`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update the shift details' : 'Add a new labor shift'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='shiftCode' render={({ field }) => (
                <FormItem><FormLabel>Code *</FormLabel><FormControl><Input {...field} placeholder='e.g. MORNING-A' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='shiftName' render={({ field }) => (
                <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} placeholder='e.g. Morning Shift A' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='startTime' render={({ field }) => (
                <FormItem><FormLabel>Start Time *</FormLabel><FormControl><Input type='time' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='endTime' render={({ field }) => (
                <FormItem><FormLabel>End Time *</FormLabel><FormControl><Input type='time' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='timezone' render={({ field }) => (
              <FormItem><FormLabel>Timezone</FormLabel><FormControl><Input {...field} placeholder='e.g. America/New_York' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={create.isPending || update.isPending}><Loader2 className={`mr-2 h-4 w-4 ${create.isPending || update.isPending ? 'animate-spin' : 'hidden'}`} />{isEdit ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
