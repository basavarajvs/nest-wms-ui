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
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  type Vendor,
} from './data/vendor-queries'

const vendorSchema = z.object({
  vendorCode: z.string().min(1, 'Vendor code is required'),
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().optional().default(true),
})

type VendorForm = z.infer<typeof vendorSchema>

export function Vendors() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useVendors()
  const createMutation = useCreateVendor()
  const updateMutation = useUpdateVendor()
  const deleteMutation = useDeleteVendor()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorForm>({
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: {
      vendorCode: '',
      name: '',
      isActive: true,
    },
  })

  const vendors = data?.vendors ?? []
  const filtered = vendors.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.vendorCode.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor)
      reset({
        vendorCode: vendor.vendorCode,
        name: vendor.name,
        isActive: vendor.isActive !== false,
      })
    } else {
      setEditingVendor(null)
      reset({ vendorCode: '', name: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: VendorForm) => {
    try {
      if (editingVendor) {
        await updateMutation.mutateAsync({ id: editingVendor.id, dto: values as any })
        toast.success('Vendor updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Vendor created')
      }
      setDialogOpen(false)
      setEditingVendor(null)
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
      toast.success('Vendor deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Vendors</h1>
          <p className='text-muted-foreground'>Manage vendor accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Create New Vendor'}</DialogTitle>
                <DialogDescription>
                  {editingVendor ? 'Update the vendor details below.' : 'Add a new vendor to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='vendorCode'>Vendor Code *</Label>
                  <Input id='vendorCode' {...register('vendorCode')} disabled={!!editingVendor} />
                  {errors.vendorCode && <p className='text-sm text-destructive'>{errors.vendorCode.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='name'>Name *</Label>
                  <Input id='name' {...register('name')} />
                  {errors.name && <p className='text-sm text-destructive'>{errors.name.message}</p>}
                </div>
                <div className='flex items-center gap-2'>
                  <input type='checkbox' {...register('isActive')} id='isActive' />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search vendors...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Master</CardTitle>
          <CardDescription>{total} vendors</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load vendors</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No vendors found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className='font-medium'>{vendor.vendorCode}</TableCell>
                      <TableCell>{vendor.name}</TableCell>
                      <TableCell>
                        <Badge variant={vendor.isActive !== false ? 'default' : 'secondary'}>
                          {vendor.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(vendor)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(vendor.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
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
