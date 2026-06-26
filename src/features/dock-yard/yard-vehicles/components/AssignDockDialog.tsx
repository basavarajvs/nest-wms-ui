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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAssignDock } from '@/features/dock-yard/yard-vehicles/data/yard-vehicle-queries'
import { useQuery } from '@tanstack/react-query'
import { LoadingDocksWebController_findAll } from '@/lib/api/wms-api/wms-web/wms-web'
import { useFacility } from '@/hooks/useFacility'
import * as z from 'zod'

const assignDockSchema = z.object({ dockId: z.string().min(1, 'Required') })

type FormValues = z.infer<typeof assignDockSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleId: string
  vehiclePlate: string
}

export function AssignDockDialog({ open, onOpenChange, vehicleId, vehiclePlate }: Props) {
  const { currentFacility } = useFacility()
  const assign = useAssignDock()

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
    resolver: zodResolver(assignDockSchema),
    defaultValues: { dockId: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await assign.mutateAsync({ id: vehicleId, dto: { dockId: values.dockId } })
      toast.success('Dock assigned')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign dock')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle>Assign Dock</DialogTitle>
          <DialogDescription>Assign a dock to vehicle {vehiclePlate}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='dockId' render={({ field }) => (
              <FormItem><FormLabel>Dock *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Select dock' /></SelectTrigger></FormControl><SelectContent>{docks.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.dockCode} - {d.dockName || ''}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
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
