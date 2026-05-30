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
  useProductSuppliers,
  useCreateProductSupplier,
  useUpdateProductSupplier,
  useDeleteProductSupplier,
  type ProductSupplier,
} from './data/product-supplier-queries'

const supplierSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  vendorSku: z.string().optional(),
  unitCost: z.coerce.number().optional(),
  currency: z.string().optional(),
  leadTimeDays: z.coerce.number().optional(),
  moq: z.coerce.number().optional(),
  isPreferred: z.boolean().optional().default(false),
})

type SupplierForm = z.infer<typeof supplierSchema>

export function ProductSuppliers() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<ProductSupplier | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useProductSuppliers()
  const createMutation = useCreateProductSupplier()
  const updateMutation = useUpdateProductSupplier()
  const deleteMutation = useDeleteProductSupplier()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      productId: '',
      vendorId: '',
      vendorSku: '',
      unitCost: undefined,
      currency: '',
      leadTimeDays: undefined,
      moq: undefined,
      isPreferred: false,
    },
  })

  const suppliers = data?.productSuppliers ?? []
  const filtered = suppliers.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.productId.toLowerCase().includes(q) || s.vendorId.toLowerCase().includes(q) || (s.vendorSku && s.vendorSku.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (sup?: ProductSupplier) => {
    if (sup) {
      setEditingSupplier(sup)
      reset({
        productId: sup.productId,
        vendorId: sup.vendorId,
        vendorSku: sup.vendorSku || '',
        unitCost: sup.unitCost,
        currency: sup.currency || '',
        leadTimeDays: sup.leadTimeDays,
        moq: sup.moq,
        isPreferred: sup.isPreferred || false,
      })
    } else {
      setEditingSupplier(null)
      reset({ productId: '', vendorId: '', vendorSku: '', unitCost: undefined, currency: '', leadTimeDays: undefined, moq: undefined, isPreferred: false })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: SupplierForm) => {
    try {
      if (editingSupplier) {
        await updateMutation.mutateAsync({ id: editingSupplier.id, dto: values as any })
        toast.success('Product supplier updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Product supplier created')
      }
      setDialogOpen(false)
      setEditingSupplier(null)
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
      toast.success('Product supplier deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Product Suppliers</h1>
          <p className='text-muted-foreground'>Manage product-supplier relationships</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Supplier Link
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier Link' : 'Create New Supplier Link'}</DialogTitle>
                <DialogDescription>
                  {editingSupplier ? 'Update the product-supplier details below.' : 'Link a product to a supplier.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID *</Label>
                  <Input id='productId' {...register('productId')} disabled={!!editingSupplier} />
                  {errors.productId && <p className='text-sm text-destructive'>{errors.productId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='vendorId'>Vendor ID *</Label>
                  <Input id='vendorId' {...register('vendorId')} />
                  {errors.vendorId && <p className='text-sm text-destructive'>{errors.vendorId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='vendorSku'>Vendor SKU</Label>
                  <Input id='vendorSku' {...register('vendorSku')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='unitCost'>Unit Cost</Label>
                  <Input id='unitCost' type='number' step='any' {...register('unitCost')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='currency'>Currency</Label>
                  <Input id='currency' {...register('currency')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='leadTimeDays'>Lead Time (Days)</Label>
                  <Input id='leadTimeDays' type='number' {...register('leadTimeDays')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='moq'>MOQ</Label>
                  <Input id='moq' type='number' {...register('moq')} />
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isPreferred')} id='isPreferred' />
                  <Label htmlFor='isPreferred'>Preferred</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingSupplier ? 'Save Changes' : 'Create Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search product suppliers...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Suppliers</CardTitle>
          <CardDescription>{total} supplier links</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load product suppliers</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No product suppliers found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Preferred</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((sup) => (
                    <TableRow key={sup.id}>
                      <TableCell className='font-medium'>{sup.productId}</TableCell>
                      <TableCell>{sup.vendorId}</TableCell>
                      <TableCell>{sup.vendorSku || '—'}</TableCell>
                      <TableCell>{sup.unitCost != null ? `${sup.currency || ''} ${sup.unitCost}` : '—'}</TableCell>
                      <TableCell>{sup.leadTimeDays != null ? `${sup.leadTimeDays}d` : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={sup.isPreferred ? 'default' : 'secondary'}>
                          {sup.isPreferred ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(sup)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(sup.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Supplier Link?</AlertDialogTitle>
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
