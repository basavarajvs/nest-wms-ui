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
  useProductPackaging,
  useCreateProductPackaging,
  useUpdateProductPackaging,
  useDeleteProductPackaging,
  type ProductPackaging,
} from './data/product-packaging-queries'

const packagingSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  fromUomId: z.string().min(1, 'From UOM is required'),
  toUomId: z.string().min(1, 'To UOM is required'),
  conversionFactor: z.coerce.number().min(0, 'Conversion factor must be positive'),
  isActive: z.boolean().optional().default(true),
})

type PackagingForm = z.infer<typeof packagingSchema>

export function ProductPackaging() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackaging, setEditingPackaging] = useState<ProductPackaging | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useProductPackaging()
  const createMutation = useCreateProductPackaging()
  const updateMutation = useUpdateProductPackaging()
  const deleteMutation = useDeleteProductPackaging()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PackagingForm>({
    resolver: zodResolver(packagingSchema) as any,
    defaultValues: {
      productId: '',
      fromUomId: '',
      toUomId: '',
      conversionFactor: undefined,
      isActive: true,
    },
  })

  const packaging = data?.packaging ?? []
  const filtered = packaging.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.productId.toLowerCase().includes(q) || p.fromUomId.toLowerCase().includes(q) || p.toUomId.toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (pkg?: ProductPackaging) => {
    if (pkg) {
      setEditingPackaging(pkg)
      reset({
        productId: pkg.productId,
        fromUomId: pkg.fromUomId,
        toUomId: pkg.toUomId,
        conversionFactor: pkg.conversionFactor,
        isActive: pkg.isActive !== false,
      })
    } else {
      setEditingPackaging(null)
      reset({ productId: '', fromUomId: '', toUomId: '', conversionFactor: undefined, isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: PackagingForm) => {
    try {
      if (editingPackaging) {
        await updateMutation.mutateAsync({ id: editingPackaging.id, dto: values as any })
        toast.success('Product packaging updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Product packaging created')
      }
      setDialogOpen(false)
      setEditingPackaging(null)
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
      toast.success('Product packaging deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Product Packaging</h1>
          <p className='text-muted-foreground'>Manage product packaging hierarchy</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Packaging
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingPackaging ? 'Edit Packaging' : 'Create New Packaging'}</DialogTitle>
                <DialogDescription>
                  {editingPackaging ? 'Update the packaging details below.' : 'Add a new product packaging to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID *</Label>
                  <Input id='productId' {...register('productId')} disabled={!!editingPackaging} />
                  {errors.productId && <p className='text-sm text-destructive'>{errors.productId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='fromUomId'>From UOM *</Label>
                  <Input id='fromUomId' {...register('fromUomId')} />
                  {errors.fromUomId && <p className='text-sm text-destructive'>{errors.fromUomId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='toUomId'>To UOM *</Label>
                  <Input id='toUomId' {...register('toUomId')} />
                  {errors.toUomId && <p className='text-sm text-destructive'>{errors.toUomId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='conversionFactor'>Conversion Factor *</Label>
                  <Input id='conversionFactor' type='number' step='any' {...register('conversionFactor')} />
                  {errors.conversionFactor && <p className='text-sm text-destructive'>{errors.conversionFactor.message}</p>}
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isActive')} id='isActive' />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingPackaging ? 'Save Changes' : 'Create Packaging'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search packaging...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Packaging</CardTitle>
          <CardDescription>{total} packaging records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load product packaging</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No packaging records found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>From UOM</TableHead>
                    <TableHead>To UOM</TableHead>
                    <TableHead>Factor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className='font-medium'>{pkg.productId}</TableCell>
                      <TableCell>{pkg.fromUomId}</TableCell>
                      <TableCell>{pkg.toUomId}</TableCell>
                      <TableCell>{pkg.conversionFactor}</TableCell>
                      <TableCell>
                        <Badge variant={pkg.isActive !== false ? 'default' : 'secondary'}>
                          {pkg.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(pkg)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(pkg.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Packaging?</AlertDialogTitle>
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
