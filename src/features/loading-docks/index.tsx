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
  useLoadingDocks,
  useCreateLoadingDock,
  useUpdateLoadingDock,
  useDeleteLoadingDock,
  type LoadingDock,
} from './data/loading-dock-queries'

const dockSchema = z.object({
  dockCode: z.string().min(1, 'Dock code is required'),
  dockName: z.string().optional(),
  dockType: z.string().optional(),
  facilityId: z.string().min(1, 'Facility ID is required'),
  locationId: z.string().optional(),
  description: z.string().optional(),
})

type DockForm = z.infer<typeof dockSchema>

export function LoadingDocks() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDock, setEditingDock] = useState<LoadingDock | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useLoadingDocks()
  const createMutation = useCreateLoadingDock()
  const updateMutation = useUpdateLoadingDock()
  const deleteMutation = useDeleteLoadingDock()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DockForm>({
    resolver: zodResolver(dockSchema) as any,
    defaultValues: {
      dockCode: '',
      dockName: '',
      dockType: '',
      facilityId: '',
      locationId: '',
      description: '',
    },
  })

  const docks = data?.loadingDocks ?? []
  const filtered = docks.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return d.dockCode.toLowerCase().includes(q) || (d.dockName && d.dockName.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (dock?: LoadingDock) => {
    if (dock) {
      setEditingDock(dock)
      reset({
        dockCode: dock.dockCode,
        dockName: dock.dockName || '',
        dockType: dock.dockType || '',
        facilityId: dock.facilityId,
        locationId: dock.locationId || '',
        description: dock.description || '',
      })
    } else {
      setEditingDock(null)
      reset({ dockCode: '', dockName: '', dockType: '', facilityId: '', locationId: '', description: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: DockForm) => {
    try {
      if (editingDock) {
        await updateMutation.mutateAsync({ id: editingDock.id, dto: values as any })
        toast.success('Loading dock updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Loading dock created')
      }
      setDialogOpen(false)
      setEditingDock(null)
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
      toast.success('Loading dock deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Loading Docks</h1>
          <p className='text-muted-foreground'>Manage loading docks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Dock
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingDock ? 'Edit Loading Dock' : 'Create New Loading Dock'}</DialogTitle>
                <DialogDescription>
                  {editingDock ? 'Update the loading dock details below.' : 'Add a new loading dock to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='dockCode'>Dock Code *</Label>
                  <Input id='dockCode' {...register('dockCode')} disabled={!!editingDock} />
                  {errors.dockCode && <p className='text-sm text-destructive'>{errors.dockCode.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='dockName'>Dock Name</Label>
                  <Input id='dockName' {...register('dockName')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='dockType'>Dock Type</Label>
                  <Input id='dockType' {...register('dockType')} />
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
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingDock ? 'Save Changes' : 'Create Dock'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search loading docks...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loading Docks</CardTitle>
          <CardDescription>{total} docks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load loading docks</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No loading docks found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((dock) => (
                    <TableRow key={dock.id}>
                      <TableCell className='font-medium'>{dock.dockCode}</TableCell>
                      <TableCell>{dock.dockName || '—'}</TableCell>
                      <TableCell>{dock.dockType || '—'}</TableCell>
                      <TableCell>{dock.facilityId}</TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(dock)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(dock.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Loading Dock?</AlertDialogTitle>
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
