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
  useCarriers,
  useCreateCarrier,
  useUpdateCarrier,
  useDeleteCarrier,
  type Carrier,
} from './data/carrier-queries'

const carrierSchema = z.object({
  carrierCode: z.string().min(1, 'Carrier code is required'),
  name: z.string().min(1, 'Name is required'),
  scac: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type CarrierForm = z.infer<typeof carrierSchema>

export function Carriers() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useCarriers()
  const createMutation = useCreateCarrier()
  const updateMutation = useUpdateCarrier()
  const deleteMutation = useDeleteCarrier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CarrierForm>({
    resolver: zodResolver(carrierSchema) as any,
    defaultValues: {
      carrierCode: '',
      name: '',
      scac: '',
      phone: '',
      website: '',
      isActive: true,
    },
  })

  const carriers = data?.carriers ?? []
  const filtered = carriers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.carrierCode.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.scac && c.scac.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (carrier?: Carrier) => {
    if (carrier) {
      setEditingCarrier(carrier)
      reset({
        carrierCode: carrier.carrierCode,
        name: carrier.name,
        scac: carrier.scac || '',
        phone: carrier.phone || '',
        website: carrier.website || '',
        isActive: carrier.isActive !== false,
      })
    } else {
      setEditingCarrier(null)
      reset({ carrierCode: '', name: '', scac: '', phone: '', website: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: CarrierForm) => {
    try {
      if (editingCarrier) {
        await updateMutation.mutateAsync({ id: editingCarrier.id, dto: values as any })
        toast.success('Carrier updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Carrier created')
      }
      setDialogOpen(false)
      setEditingCarrier(null)
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
      toast.success('Carrier deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Carriers</h1>
          <p className='text-muted-foreground'>Manage shipping carriers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Carrier
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingCarrier ? 'Edit Carrier' : 'Create New Carrier'}</DialogTitle>
                <DialogDescription>
                  {editingCarrier ? 'Update the carrier details below.' : 'Add a new carrier to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='carrierCode'>Carrier Code *</Label>
                  <Input id='carrierCode' {...register('carrierCode')} disabled={!!editingCarrier} />
                  {errors.carrierCode && <p className='text-sm text-destructive'>{errors.carrierCode.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>Name *</Label>
                  <Input id='name' {...register('name')} />
                  {errors.name && <p className='text-sm text-destructive'>{errors.name.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='scac'>SCAC</Label>
                  <Input id='scac' {...register('scac')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input id='phone' {...register('phone')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='website'>Website</Label>
                  <Input id='website' {...register('website')} />
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isActive')} id='isActive' />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingCarrier ? 'Save Changes' : 'Create Carrier'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search carriers...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carriers</CardTitle>
          <CardDescription>{total} carriers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load carriers</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No carriers found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SCAC</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((carrier) => (
                    <TableRow key={carrier.id}>
                      <TableCell className='font-medium'>{carrier.carrierCode}</TableCell>
                      <TableCell>{carrier.name}</TableCell>
                      <TableCell>{carrier.scac || '—'}</TableCell>
                      <TableCell>{carrier.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={carrier.isActive !== false ? 'default' : 'secondary'}>
                          {carrier.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(carrier)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(carrier.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Carrier?</AlertDialogTitle>
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
