import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { LoadStatus } from '@/types/warehouse-statuses'
import { Plus, Search, Edit, Trash2, Truck, Ship } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadStatusBadge } from '@/components/status-badges'
import {
  useLoads,
  useCreateLoad,
  useUpdateLoad,
  useDeleteLoad,
  useMarkLoadLoaded,
  useMarkLoadDeparted,
  type Load,
} from './data/load-queries'

const loadSchema = z.object({
  loadNumber: z.string().min(1, 'Load number is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  carrierCode: z.string().optional(),
  dockDoorCode: z.string().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  notes: z.string().optional(),
})

type LoadForm = z.infer<typeof loadSchema>

export function Loads() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLoad, setEditingLoad] = useState<Load | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useLoads()
  const createMutation = useCreateLoad()
  const updateMutation = useUpdateLoad()
  const deleteMutation = useDeleteLoad()
  const markLoadedMutation = useMarkLoadLoaded()
  const markDepartedMutation = useMarkLoadDeparted()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoadForm>({
    resolver: zodResolver(loadSchema) as any,
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

  const loads = data?.loads ?? []
  const filtered = loads.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.loadNumber.toLowerCase().includes(q) ||
      (l.carrierCode && l.carrierCode.toLowerCase().includes(q))
    )
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (load?: Load) => {
    if (load) {
      setEditingLoad(load)
      reset({
        loadNumber: load.loadNumber,
        facilityId: load.facilityId,
        carrierCode: load.carrierCode || '',
        dockDoorCode: load.dockDoorCode || '',
        driverName: load.driverName || '',
        driverPhone: load.driverPhone || '',
        vehiclePlate: load.vehiclePlate || '',
        notes: load.notes || '',
      })
    } else {
      setEditingLoad(null)
      reset({
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
    setDialogOpen(true)
  }

  const onSubmit = async (values: LoadForm) => {
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
      setDialogOpen(false)
      setEditingLoad(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Operation failed'
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Load deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleMarkLoaded = async (id: string) => {
    try {
      await markLoadedMutation.mutateAsync(id)
      toast.success('Load marked as Loaded')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark loaded')
    }
  }

  const handleMarkDeparted = async (id: string) => {
    try {
      await markDepartedMutation.mutateAsync(id)
      toast.success('Load marked as Departed')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark departed')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Loads</h1>
          <p className='text-muted-foreground'>
            Manage outbound loads and shipments
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Load
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingLoad ? 'Edit Load' : 'Create New Load'}
                </DialogTitle>
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
                    {...register('loadNumber')}
                    disabled={!!editingLoad}
                  />
                  {errors.loadNumber && (
                    <p className='text-sm text-destructive'>
                      {errors.loadNumber.message}
                    </p>
                  )}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && (
                    <p className='text-sm text-destructive'>
                      {errors.facilityId.message}
                    </p>
                  )}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='carrierCode'>Carrier Code</Label>
                  <Input id='carrierCode' {...register('carrierCode')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='dockDoorCode'>Dock Door Code</Label>
                  <Input id='dockDoorCode' {...register('dockDoorCode')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='driverName'>Driver Name</Label>
                  <Input id='driverName' {...register('driverName')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='driverPhone'>Driver Phone</Label>
                  <Input id='driverPhone' {...register('driverPhone')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='vehiclePlate'>Vehicle Plate</Label>
                  <Input id='vehiclePlate' {...register('vehiclePlate')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={
                    isSubmitting ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {editingLoad ? 'Save Changes' : 'Create Load'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search loads...'
          className='pl-9'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loads</CardTitle>
          <CardDescription>{total} loads</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load loads
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              No loads found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load Number</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((load) => (
                    <TableRow key={load.id}>
                      <TableCell className='font-medium'>
                        {load.loadNumber}
                      </TableCell>
                      <TableCell>{load.facilityId}</TableCell>
                      <TableCell>{load.carrierCode || '—'}</TableCell>
                      <TableCell>{load.driverName || '—'}</TableCell>
                      <TableCell>
                        <LoadStatusBadge
                          status={
                            (load.status?.toUpperCase() as LoadStatus) ||
                            (load.status as LoadStatus)
                          }
                        />
                      </TableCell>
                      <TableCell className='space-x-1 text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openDialog(load)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleMarkLoaded(load.id)}
                          title='Mark Loaded'
                        >
                          <Truck className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleMarkDeparted(load.id)}
                          title='Mark Departed'
                        >
                          <Ship className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteId(load.id)}
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className='mt-4 flex justify-between text-sm'>
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className='space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
