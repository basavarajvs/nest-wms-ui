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
  useProductClientAssignments,
  useCreateProductClientAssignment,
  useUpdateProductClientAssignment,
  useDeleteProductClientAssignment,
  type ProductClientAssignment,
} from './data/product-client-assignment-queries'

const assignmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type AssignmentForm = z.infer<typeof assignmentSchema>

export function ProductClientAssignments() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ProductClientAssignment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useProductClientAssignments()
  const createMutation = useCreateProductClientAssignment()
  const updateMutation = useUpdateProductClientAssignment()
  const deleteMutation = useDeleteProductClientAssignment()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema) as any,
    defaultValues: {
      productId: '',
      clientId: '',
      facilityId: '',
      effectiveDate: '',
      expiryDate: '',
      notes: '',
      isActive: true,
    },
  })

  const assignments = data?.assignments ?? []
  const filtered = assignments.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return a.productId.toLowerCase().includes(q) || a.clientId.toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (assn?: ProductClientAssignment) => {
    if (assn) {
      setEditingAssignment(assn)
      reset({
        productId: assn.productId,
        clientId: assn.clientId,
        facilityId: assn.facilityId,
        effectiveDate: assn.effectiveDate || '',
        expiryDate: assn.expiryDate || '',
        notes: assn.notes || '',
        isActive: assn.isActive !== false,
      })
    } else {
      setEditingAssignment(null)
      reset({ productId: '', clientId: '', facilityId: '', effectiveDate: '', expiryDate: '', notes: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: AssignmentForm) => {
    try {
      if (editingAssignment) {
        await updateMutation.mutateAsync({ id: editingAssignment.id, dto: values as any })
        toast.success('Assignment updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Assignment created')
      }
      setDialogOpen(false)
      setEditingAssignment(null)
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
      toast.success('Assignment deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Product-Client Assignments</h1>
          <p className='text-muted-foreground'>Manage product to client assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</DialogTitle>
                <DialogDescription>
                  {editingAssignment ? 'Update the assignment details below.' : 'Assign a product to a client.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID *</Label>
                  <Input id='productId' {...register('productId')} disabled={!!editingAssignment} />
                  {errors.productId && <p className='text-sm text-destructive'>{errors.productId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='clientId'>Client ID *</Label>
                  <Input id='clientId' {...register('clientId')} />
                  {errors.clientId && <p className='text-sm text-destructive'>{errors.clientId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='effectiveDate'>Effective Date</Label>
                  <Input id='effectiveDate' type='date' {...register('effectiveDate')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='expiryDate'>Expiry Date</Label>
                  <Input id='expiryDate' type='date' {...register('expiryDate')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isActive')} id='isActive' />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingAssignment ? 'Save Changes' : 'Create Assignment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search assignments...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product-Client Assignments</CardTitle>
          <CardDescription>{total} assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load assignments</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No assignments found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((assn) => (
                    <TableRow key={assn.id}>
                      <TableCell className='font-medium'>{assn.productId}</TableCell>
                      <TableCell>{assn.clientId}</TableCell>
                      <TableCell>{assn.facilityId}</TableCell>
                      <TableCell>{assn.effectiveDate ? new Date(assn.effectiveDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{assn.expiryDate ? new Date(assn.expiryDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={assn.isActive !== false ? 'default' : 'secondary'}>
                          {assn.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(assn)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(assn.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
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
