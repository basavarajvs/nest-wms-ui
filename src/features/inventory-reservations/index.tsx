import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2, Unlock } from 'lucide-react'
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
  useInventoryReservations,
  useCreateInventoryReservation,
  useUpdateInventoryReservation,
  useDeleteInventoryReservation,
  useReleaseInventoryReservation,
  type InventoryReservation,
} from './data/inventory-reservation-queries'

const reservationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
  quantity: z.coerce.number().min(0, 'Quantity must be positive'),
  uomId: z.string().min(1, 'UOM ID is required'),
  reservationType: z.string().min(1, 'Reservation type is required'),
  referenceType: z.string().min(1, 'Reference type is required'),
  referenceId: z.string().min(1, 'Reference ID is required'),
  lotId: z.string().optional(),
  expiresAt: z.string().optional(),
})

type ReservationForm = z.infer<typeof reservationSchema>

export function InventoryReservations() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<InventoryReservation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useInventoryReservations()
  const createMutation = useCreateInventoryReservation()
  const updateMutation = useUpdateInventoryReservation()
  const deleteMutation = useDeleteInventoryReservation()
  const releaseMutation = useReleaseInventoryReservation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema) as any,
    defaultValues: {
      productId: '',
      facilityId: '',
      locationId: '',
      quantity: undefined,
      uomId: '',
      reservationType: '',
      referenceType: '',
      referenceId: '',
      lotId: '',
      expiresAt: '',
    },
  })

  const reservations = data?.reservations ?? []
  const filtered = reservations.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.productId.toLowerCase().includes(q) || r.referenceId.toLowerCase().includes(q) || r.reservationType.toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (res?: InventoryReservation) => {
    if (res) {
      setEditingReservation(res)
      reset({
        productId: res.productId,
        facilityId: res.facilityId,
        locationId: res.locationId,
        quantity: res.quantity,
        uomId: res.uomId,
        reservationType: res.reservationType,
        referenceType: res.referenceType,
        referenceId: res.referenceId,
        lotId: res.lotId || '',
        expiresAt: res.expiresAt || '',
      })
    } else {
      setEditingReservation(null)
      reset({ productId: '', facilityId: '', locationId: '', quantity: undefined, uomId: '', reservationType: '', referenceType: '', referenceId: '', lotId: '', expiresAt: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: ReservationForm) => {
    try {
      if (editingReservation) {
        await updateMutation.mutateAsync({ id: editingReservation.id, dto: values as any })
        toast.success('Reservation updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Reservation created')
      }
      setDialogOpen(false)
      setEditingReservation(null)
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
      toast.success('Reservation deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleRelease = async (id: string) => {
    try {
      await releaseMutation.mutateAsync(id)
      toast.success('Reservation released')
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Release failed')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Inventory Reservations</h1>
          <p className='text-muted-foreground'>Manage inventory reservations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingReservation ? 'Edit Reservation' : 'Create New Reservation'}</DialogTitle>
                <DialogDescription>
                  {editingReservation ? 'Update the reservation details below.' : 'Add a new inventory reservation to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID *</Label>
                  <Input id='productId' {...register('productId')} disabled={!!editingReservation} />
                  {errors.productId && <p className='text-sm text-destructive'>{errors.productId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='locationId'>Location ID *</Label>
                  <Input id='locationId' {...register('locationId')} />
                  {errors.locationId && <p className='text-sm text-destructive'>{errors.locationId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='quantity'>Quantity *</Label>
                  <Input id='quantity' type='number' {...register('quantity')} />
                  {errors.quantity && <p className='text-sm text-destructive'>{errors.quantity.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='uomId'>UOM ID *</Label>
                  <Input id='uomId' {...register('uomId')} />
                  {errors.uomId && <p className='text-sm text-destructive'>{errors.uomId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='reservationType'>Reservation Type *</Label>
                  <Input id='reservationType' {...register('reservationType')} />
                  {errors.reservationType && <p className='text-sm text-destructive'>{errors.reservationType.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='referenceType'>Reference Type *</Label>
                  <Input id='referenceType' {...register('referenceType')} />
                  {errors.referenceType && <p className='text-sm text-destructive'>{errors.referenceType.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='referenceId'>Reference ID *</Label>
                  <Input id='referenceId' {...register('referenceId')} />
                  {errors.referenceId && <p className='text-sm text-destructive'>{errors.referenceId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='lotId'>Lot ID</Label>
                  <Input id='lotId' {...register('lotId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='expiresAt'>Expires At</Label>
                  <Input id='expiresAt' type='date' {...register('expiresAt')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingReservation ? 'Save Changes' : 'Create Reservation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search reservations...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Reservations</CardTitle>
          <CardDescription>{total} reservations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load reservations</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No reservations found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((res) => (
                    <TableRow key={res.id}>
                      <TableCell className='font-medium'>{res.productId}</TableCell>
                      <TableCell>{res.locationId}</TableCell>
                      <TableCell>{res.quantity} {res.uomId}</TableCell>
                      <TableCell>{res.reservationType}</TableCell>
                      <TableCell>{res.referenceType}:{res.referenceId}</TableCell>
                      <TableCell><Badge variant='outline'>{res.status || 'Active'}</Badge></TableCell>
                      <TableCell className='space-x-1 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => handleRelease(res.id)} title='Release'><Unlock className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(res)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(res.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
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
