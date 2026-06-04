import { useEffect } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useLoads, useCreateLoad, useUpdateLoad, type Load } from '../data/load-queries'

const loadFormSchema = z.object({
  loadNumber: z.string().min(1, 'Load number is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  carrierCode: z.string().optional(),
  dockDoorCode: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  notes: z.string().optional(),
})

type LoadFormData = z.infer<typeof loadFormSchema>

interface LoadCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLoad?: Load | null
}

export function LoadCreateDialog({
  open,
  onOpenChange,
  editingLoad,
}: LoadCreateDialogProps) {
  const createMutation = useCreateLoad()
  const updateMutation = useUpdateLoad()
  const { refetch } = useLoads()

  const form = useForm<LoadFormData>({
    resolver: zodResolver(loadFormSchema),
    defaultValues: {
      loadNumber: '',
      facilityId: '',
      carrierCode: '',
      dockDoorCode: '',
      driverName: '',
      driverPhone: '',
      vehiclePlate: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (editingLoad) {
      form.reset({
        loadNumber: editingLoad.loadNumber,
        facilityId: editingLoad.facilityId,
        carrierCode: editingLoad.carrierCode || '',
        dockDoorCode: editingLoad.dockDoorCode || '',
        driverName: editingLoad.driverName || '',
        driverPhone: editingLoad.driverPhone || '',
        vehiclePlate: editingLoad.vehiclePlate || '',
        notes: editingLoad.notes || '',
      })
    } else {
      form.reset({
        loadNumber: '',
        facilityId: '',
        carrierCode: '',
        dockDoorCode: '',
        driverName: '',
        driverPhone: '',
        vehiclePlate: '',
        notes: '',
      })
    }
  }, [editingLoad, form])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (values: LoadFormData) => {
    try {
      if (editingLoad) {
        await updateMutation.mutateAsync({
          id: editingLoad.id,
          dto: values as any,
        })
        toast.success('Load updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Load created')
      }
      onOpenChange(false)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{editingLoad ? 'Edit Load' : 'Create New Load'}</DialogTitle>
            <DialogDescription>
              {editingLoad
                ? 'Update the load details below.'
                : 'Add a new load to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='loadNumber'>Load Number *</Label>
              <Input
                id='loadNumber'
                {...form.register('loadNumber')}
                disabled={!!editingLoad}
              />
              {form.formState.errors.loadNumber && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.loadNumber.message}
                </p>
              )}
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='facilityId'>Facility ID *</Label>
              <Input id='facilityId' {...form.register('facilityId')} />
              {form.formState.errors.facilityId && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.facilityId.message}
                </p>
              )}
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='dockDoorCode'>Dock Door</Label>
                <Input
                  id='dockDoorCode'
                  {...form.register('dockDoorCode')}
                  placeholder='e.g. DOCK-01'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='carrierCode'>Carrier Code</Label>
                <Input
                  id='carrierCode'
                  {...form.register('carrierCode')}
                  placeholder='e.g. FEDEX'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='driverName'>Driver Name</Label>
                <Input
                  id='driverName'
                  {...form.register('driverName')}
                  placeholder='Driver name'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='driverPhone'>Driver Phone</Label>
                <Input
                  id='driverPhone'
                  {...form.register('driverPhone')}
                  placeholder='Phone number'
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='vehiclePlate'>Vehicle Plate</Label>
              <Input
                id='vehiclePlate'
                {...form.register('vehiclePlate')}
                placeholder='License plate number'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                {...form.register('notes')}
                rows={2}
                placeholder='Optional notes'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {editingLoad ? 'Save Changes' : 'Create Load'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
