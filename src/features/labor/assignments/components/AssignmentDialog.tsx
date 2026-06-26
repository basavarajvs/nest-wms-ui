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
import { useCreateAssignment } from '@/features/labor/assignments/data/assignment-queries'
import { useShiftList } from '@/features/labor/shifts/data/shift-queries'
import { useFacility } from '@/hooks/useFacility'
import * as z from 'zod'

const assignmentSchema = z.object({
  shiftId: z.string().min(1, 'Required'),
  userId: z.string().min(1, 'Required'),
  effectiveDate: z.string().min(1, 'Required'),
  expiryDate: z.string().optional(),
})

type FormValues = z.infer<typeof assignmentSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignmentDialog({ open, onOpenChange }: Props) {
  const { currentFacility } = useFacility()
  const assign = useCreateAssignment()
  const { data: shiftsData } = useShiftList({ facilityId: currentFacility?.id || '' })

  const shifts = shiftsData?.shifts || []

  const form = useForm<FormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { shiftId: '', userId: '', effectiveDate: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await assign.mutateAsync({ ...values, facilityId: currentFacility?.id || '' })
      toast.success('Shift assigned')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign shift')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Assign Shift</DialogTitle>
          <DialogDescription>Assign a shift to a user</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='shiftId' render={({ field }) => (
              <FormItem><FormLabel>Shift *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Select shift' /></SelectTrigger></FormControl><SelectContent>{shifts.map((s) => <SelectItem key={s.id} value={s.id}>{s.shiftCode} - {s.shiftName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='userId' render={({ field }) => (
              <FormItem><FormLabel>User ID *</FormLabel><FormControl><Input {...field} placeholder='User ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='effectiveDate' render={({ field }) => (
                <FormItem><FormLabel>Effective Date *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='expiryDate' render={({ field }) => (
                <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={assign.isPending}><Loader2 className={`mr-2 h-4 w-4 ${assign.isPending ? 'animate-spin' : 'hidden'}`} />Assign</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
