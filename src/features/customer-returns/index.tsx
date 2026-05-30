import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
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
  useCustomerReturns,
  useCreateCustomerReturn,
  useUpdateCustomerReturnStatus,
  useDeleteCustomerReturn,
  useReturnItems,
  useCreateReturnItem,
  useUpdateReturnItem,
  useDeleteReturnItem,
  type CustomerReturn,
  type CustomerReturnItem,
} from './data/customer-return-queries'

const returnSchema = z.object({
  returnNumber: z.string().min(1, 'Return number is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  clientCode: z.string().optional(),
  carrier: z.string().optional(),
  rmaNumber: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
})

type ReturnForm = z.infer<typeof returnSchema>

const returnItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(1, 'Quantity is required'),
  condition: z.string().optional(),
  disposition: z.string().optional(),
  notes: z.string().optional(),
})

type ReturnItemForm = z.infer<typeof returnItemSchema>

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Received: 'default',
  Inspected: 'secondary',
  Completed: 'outline',
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant='outline'>Unknown</Badge>
  return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>
}

export function CustomerReturns() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReturn, setEditingReturn] = useState<CustomerReturn | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useCustomerReturns()
  const createMutation = useCreateCustomerReturn()
  const updateMutation = useUpdateCustomerReturnStatus()
  const deleteMutation = useDeleteCustomerReturn()

  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CustomerReturnItem | null>(null)
  const [selectedReturnIdForItems, setSelectedReturnIdForItems] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<CustomerReturnItem | null>(null)

  const { data: itemsData, isLoading: itemsLoading } = useReturnItems(expandedReturnId ?? '')
  const createItem = useCreateReturnItem()
  const updateItem = useUpdateReturnItem()
  const deleteItem = useDeleteReturnItem()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema) as any,
    defaultValues: {
      returnNumber: '',
      facilityId: '',
      clientCode: '',
      carrier: '',
      rmaNumber: '',
      trackingNumber: '',
      notes: '',
    },
  })

  const itemForm = useForm<ReturnItemForm>({
    resolver: zodResolver(returnItemSchema) as any,
    defaultValues: {
      productId: '',
      quantity: 1,
      condition: '',
      disposition: '',
      notes: '',
    },
  })

  const returns = data?.customerReturns ?? []
  const filtered = returns.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.returnNumber.toLowerCase().includes(q) || (r.clientCode && r.clientCode.toLowerCase().includes(q)) || (r.rmaNumber && r.rmaNumber.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (ret?: CustomerReturn) => {
    if (ret) {
      setEditingReturn(ret)
      reset({
        returnNumber: ret.returnNumber,
        facilityId: ret.facilityId,
        clientCode: ret.clientCode || '',
        carrier: ret.carrier || '',
        rmaNumber: ret.rmaNumber || '',
        trackingNumber: ret.trackingNumber || '',
        notes: ret.notes || '',
      })
    } else {
      setEditingReturn(null)
      reset({ returnNumber: '', facilityId: '', clientCode: '', carrier: '', rmaNumber: '', trackingNumber: '', notes: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: ReturnForm) => {
    try {
      if (editingReturn) {
        await updateMutation.mutateAsync({ id: editingReturn.id, dto: values as any })
        toast.success('Customer return updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Customer return created')
      }
      setDialogOpen(false)
      setEditingReturn(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const onSubmitItem = async (values: ReturnItemForm) => {
    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          dto: {
            quantity: values.quantity,
            condition: values.condition,
            disposition: values.disposition,
            notes: values.notes,
          },
        })
        toast.success('Return item updated')
      } else {
        await createItem.mutateAsync({
          customerReturnId: selectedReturnIdForItems!,
          productId: values.productId,
          quantity: values.quantity,
          condition: values.condition,
          disposition: values.disposition,
          notes: values.notes,
        } as any)
        toast.success('Return item created')
      }
      setItemDialogOpen(false)
      setEditingItem(null)
      itemForm.reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Customer return deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Customer Returns</h1>
          <p className='text-muted-foreground'>Manage customer returns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Return
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingReturn ? 'Edit Return' : 'Create New Return'}</DialogTitle>
                <DialogDescription>
                  {editingReturn ? 'Update the return details below.' : 'Add a new customer return to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='returnNumber'>Return Number *</Label>
                  <Input id='returnNumber' {...register('returnNumber')} disabled={!!editingReturn} />
                  {errors.returnNumber && <p className='text-sm text-destructive'>{errors.returnNumber.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='clientCode'>Client Code</Label>
                  <Input id='clientCode' {...register('clientCode')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='carrier'>Carrier</Label>
                  <Input id='carrier' {...register('carrier')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='rmaNumber'>RMA Number</Label>
                  <Input id='rmaNumber' {...register('rmaNumber')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='trackingNumber'>Tracking Number</Label>
                  <Input id='trackingNumber' {...register('trackingNumber')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingReturn ? 'Save Changes' : 'Create Return'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search returns...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Returns</CardTitle>
          <CardDescription>{total} returns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load returns</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No returns found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-10'></TableHead>
                    <TableHead>Return Number</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>RMA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell>
                        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => setExpandedReturnId(expandedReturnId === ret.id ? null : ret.id)}>
                          {expandedReturnId === ret.id ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>{ret.returnNumber}</TableCell>
                      <TableCell>{ret.facilityId}</TableCell>
                      <TableCell>{ret.clientCode || '—'}</TableCell>
                      <TableCell>{ret.rmaNumber || '—'}</TableCell>
                      <TableCell><StatusBadge status={ret.status} /></TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(ret)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(ret.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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

      {expandedReturnId && (
        <Card>
          <CardHeader className='py-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>Return Items</CardTitle>
              <Button size='sm' variant='outline' onClick={() => { setSelectedReturnIdForItems(expandedReturnId); setEditingItem(null); itemForm.reset({ productId: '', quantity: 1, condition: '', disposition: '', notes: '' }); setItemDialogOpen(true) }}>
                <Plus className='mr-1 h-3 w-3' /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className='py-2'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Disposition</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className='w-[80px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsLoading ? (
                  <TableRow><TableCell colSpan={6} className='py-4 text-center'><Loader2 className='mx-auto h-4 w-4 animate-spin' /></TableCell></TableRow>
                ) : itemsData?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className='py-4 text-center text-muted-foreground'>No items</TableCell></TableRow>
                ) : (
                  itemsData?.map((item: CustomerReturnItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.condition || '—'}</TableCell>
                      <TableCell>{item.disposition || '—'}</TableCell>
                      <TableCell>{item.notes || '—'}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => { setEditingItem(item); setSelectedReturnIdForItems(expandedReturnId); itemForm.reset({ productId: item.productId, quantity: item.quantity, condition: item.condition ?? '', disposition: item.disposition ?? '', notes: item.notes ?? '' }); setItemDialogOpen(true) }}>
                            <Edit className='h-3.5 w-3.5' />
                          </Button>
                          <Button variant='ghost' size='icon' className='h-8 w-8 text-destructive' onClick={() => setItemToDelete(item)}>
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Return Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <form onSubmit={itemForm.handleSubmit(onSubmitItem)}>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Return Item' : 'Add Return Item'}</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label>Product ID *</Label>
                <Input {...itemForm.register('productId')} placeholder='product-uuid' disabled={!!editingItem} />
                {itemForm.formState.errors.productId && <p className='text-sm text-destructive'>{itemForm.formState.errors.productId.message}</p>}
              </div>
              <div className='grid gap-2'>
                <Label>Quantity *</Label>
                <Input type='number' {...itemForm.register('quantity', { valueAsNumber: true })} />
                {itemForm.formState.errors.quantity && <p className='text-sm text-destructive'>{itemForm.formState.errors.quantity.message}</p>}
              </div>
              <div className='grid gap-2'>
                <Label>Condition</Label>
                <Input {...itemForm.register('condition')} placeholder='Damaged, Good, Used' />
              </div>
              <div className='grid gap-2'>
                <Label>Disposition</Label>
                <Input {...itemForm.register('disposition')} placeholder='Restock, Scrap, ReturnToVendor' />
              </div>
              <div className='grid gap-2'>
                <Label>Notes</Label>
                <Input {...itemForm.register('notes')} placeholder='Optional notes' />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setItemDialogOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={createItem.isPending || updateItem.isPending}>
                {editingItem ? 'Update' : 'Create'} Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Return Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove item for {(itemToDelete as any)?.productId ?? ''}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteItem.mutate((itemToDelete as any).id); setItemToDelete(null) }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Return?</AlertDialogTitle>
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
