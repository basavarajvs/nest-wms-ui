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
import { useRegisterVehicle } from '@/features/dock-yard/yard-vehicles/data/yard-vehicle-queries'
import { useFacility } from '@/hooks/useFacility'
import * as z from 'zod'

const registerVehicleSchema = z.object({
  vehiclePlate: z.string().min(1, 'Required'),
  vehicleType: z.enum(['TRUCK', 'TRAILER', 'CONTAINER']),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  carrierCode: z.string().optional(),
  sealNumber: z.string().optional(),
  yardLocation: z.string().optional(),
})

type FormValues = z.infer<typeof registerVehicleSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VehicleDialog({ open, onOpenChange }: Props) {
  const { currentFacility } = useFacility()
  const register = useRegisterVehicle()

  const form = useForm<FormValues>({
    resolver: zodResolver(registerVehicleSchema),
    defaultValues: { vehiclePlate: '', vehicleType: 'TRUCK' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await register.mutateAsync({ ...values, facilityId: currentFacility?.id || '' })
      toast.success('Vehicle registered')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to register vehicle')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Register Vehicle</DialogTitle>
          <DialogDescription>Add a new vehicle to the yard</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='vehiclePlate' render={({ field }) => (
                <FormItem><FormLabel>Plate *</FormLabel><FormControl><Input {...field} placeholder='e.g. CA-1234' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='vehicleType' render={({ field }) => (
                <FormItem><FormLabel>Type *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='TRUCK'>Truck</SelectItem><SelectItem value='TRAILER'>Trailer</SelectItem><SelectItem value='CONTAINER'>Container</SelectItem></SelectContent></Select><FormMessage /></FormItem>
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
              <FormField control={form.control} name='carrierCode' render={({ field }) => (
                <FormItem><FormLabel>Carrier Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='sealNumber' render={({ field }) => (
                <FormItem><FormLabel>Seal #</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='yardLocation' render={({ field }) => (
              <FormItem><FormLabel>Yard Location</FormLabel><FormControl><Input {...field} placeholder='e.g. Lot A-3' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={register.isPending}><Loader2 className={`mr-2 h-4 w-4 ${register.isPending ? 'animate-spin' : 'hidden'}`} />Register</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
