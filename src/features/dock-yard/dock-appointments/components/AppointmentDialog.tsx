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
import { useCreateAppointment } from '@/features/dock-yard/dock-appointments/data/dock-appointment-queries'
import { useQuery } from '@tanstack/react-query'
import { LoadingDocksWebController_findAll } from '@/lib/api/wms-api/wms-web/wms-web'
import { useFacility } from '@/hooks/useFacility'
import * as z from 'zod'

const createAppointmentSchema = z.object({
  appointmentNumber: z.string().min(1, 'Required'),
  appointmentType: z.enum(['RECEIVING', 'SHIPPING', 'BOTH']),
  dockId: z.string().min(1, 'Required'),
  scheduledStart: z.string().min(1, 'Required'),
  scheduledEnd: z.string().min(1, 'Required'),
  carrierCode: z.string().optional(),
  carrierName: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  trailerId: z.string().optional(),
  referenceType: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof createAppointmentSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentDialog({ open, onOpenChange }: Props) {
  const { currentFacility } = useFacility()
  const create = useCreateAppointment()
  const { data: docksData } = useQuery({
    queryKey: ['wms', 'loading-docks', 'list', { facilityId: currentFacility?.id || '' }],
    queryFn: async ({ queryKey }) => {
      const [, , , p] = queryKey
      const params = p as { facilityId: string }
      return LoadingDocksWebController_findAll(params) as unknown as { items?: any[] }
    },
    enabled: !!currentFacility?.id,
    staleTime: 1000 * 60 * 5,
  })

  const docks = Array.isArray((docksData as any)?.items)
    ? (docksData as any).items
    : Array.isArray(docksData)
      ? (docksData as any)
      : []

  const form = useForm<FormValues>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      appointmentNumber: '', appointmentType: 'RECEIVING', dockId: '',
      scheduledStart: '', scheduledEnd: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await create.mutateAsync({
        ...values,
        appointmentType: values.appointmentType as 'RECEIVING' | 'SHIPPING' | 'BOTH',
        facilityId: currentFacility?.id || '',
      })
      toast.success('Appointment created')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create appointment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Create Dock Appointment</DialogTitle>
          <DialogDescription>Schedule a new dock appointment</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='appointmentNumber' render={({ field }) => (
                <FormItem><FormLabel>Appointment # *</FormLabel><FormControl><Input {...field} placeholder='e.g. APP-001' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='appointmentType' render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='RECEIVING'>Receiving</SelectItem><SelectItem value='SHIPPING'>Shipping</SelectItem><SelectItem value='BOTH'>Both</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='dockId' render={({ field }) => (
                <FormItem><FormLabel>Dock *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Select dock' /></SelectTrigger></FormControl><SelectContent>{docks.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.dockCode} - {d.dockName || ''}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='carrierName' render={({ field }) => (
                <FormItem><FormLabel>Carrier</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='scheduledStart' render={({ field }) => (
                <FormItem><FormLabel>Start *</FormLabel><FormControl><Input type='datetime-local' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='scheduledEnd' render={({ field }) => (
                <FormItem><FormLabel>End *</FormLabel><FormControl><Input type='datetime-local' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='driverName' render={({ field }) => (
                <FormItem><FormLabel>Driver</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='driverPhone' render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='vehiclePlate' render={({ field }) => (
                <FormItem><FormLabel>Vehicle Plate</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='trailerId' render={({ field }) => (
                <FormItem><FormLabel>Trailer ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={create.isPending}><Loader2 className={`mr-2 h-4 w-4 ${create.isPending ? 'animate-spin' : 'hidden'}`} />Create</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
