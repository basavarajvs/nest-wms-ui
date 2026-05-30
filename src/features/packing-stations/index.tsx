import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  usePackingStations,
  useCreatePackingStation,
  useUpdatePackingStation,
  useDeletePackingStation,
  type PackingStation,
} from './data/packing-station-queries'

const stationSchema = z.object({
  stationCode: z.string().min(1, 'Station code is required'),
  stationName: z.string().optional(),
  facilityId: z.string().min(1, 'Facility ID is required'),
  locationId: z.string().optional(),
  description: z.string().optional(),
  isAvailable: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
})

type StationForm = z.infer<typeof stationSchema>

export function PackingStations() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStation, setEditingStation] = useState<PackingStation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = usePackingStations()
  const createMutation = useCreatePackingStation()
  const updateMutation = useUpdatePackingStation()
  const deleteMutation = useDeletePackingStation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StationForm>({
    resolver: zodResolver(stationSchema) as any,
    defaultValues: {
      stationCode: '',
      stationName: '',
      facilityId: '',
      locationId: '',
      description: '',
      isAvailable: true,
      isActive: true,
    },
  })

  const stations = data?.packingStations ?? []
  const filtered = stations.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.stationCode.toLowerCase().includes(q) || (s.stationName && s.stationName.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (station?: PackingStation) => {
    if (station) {
      setEditingStation(station)
      reset({
        stationCode: station.stationCode,
        stationName: station.stationName || '',
        facilityId: station.facilityId,
        locationId: station.locationId || '',
        description: station.description || '',
        isAvailable: station.isAvailable !== false,
        isActive: station.isActive !== false,
      })
    } else {
      setEditingStation(null)
      reset({ stationCode: '', stationName: '', facilityId: '', locationId: '', description: '', isAvailable: true, isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: StationForm) => {
    try {
      if (editingStation) {
        await updateMutation.mutateAsync({ id: editingStation.id, dto: values as any })
        toast.success('Packing station updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Packing station created')
      }
      setDialogOpen(false)
      setEditingStation(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Packing station deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Packing Stations</h1>
          <p className='text-muted-foreground'>Manage packing stations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Station
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingStation ? 'Edit Packing Station' : 'Create New Packing Station'}</DialogTitle>
                <DialogDescription>
                  {editingStation ? 'Update the packing station details below.' : 'Add a new packing station to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='stationCode'>Station Code *</Label>
                  <Input id='stationCode' {...register('stationCode')} disabled={!!editingStation} />
                  {errors.stationCode && <p className='text-sm text-destructive'>{errors.stationCode.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='stationName'>Station Name</Label>
                  <Input id='stationName' {...register('stationName')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='locationId'>Location ID</Label>
                  <Input id='locationId' {...register('locationId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Input id='description' {...register('description')} />
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isAvailable')} id='isAvailable' />
                  <Label htmlFor='isAvailable'>Available</Label>
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isActive')} id='isActive' />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingStation ? 'Save Changes' : 'Create Station'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search packing stations...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packing Stations</CardTitle>
          <CardDescription>{total} stations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load packing stations</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No packing stations found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className='font-medium'>{station.stationCode}</TableCell>
                      <TableCell>{station.stationName || '—'}</TableCell>
                      <TableCell>{station.facilityId}</TableCell>
                      <TableCell>
                        <Badge variant={station.isAvailable !== false ? 'default' : 'secondary'}>
                          {station.isAvailable !== false ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={station.isActive !== false ? 'default' : 'secondary'}>
                          {station.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(station)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(station.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className='mt-4 flex justify-between text-sm'>
                <span>Page {page} of {totalPages}</span>
                <div className='space-x-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Packing Station?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
