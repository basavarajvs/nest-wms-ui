import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
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
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useDeletePurchaseOrder,
  usePurchaseOrderLines,
  useCreatePurchaseOrderLine,
  useUpdatePurchaseOrderLine,
  useDeletePurchaseOrderLine,
  type PurchaseOrder,
  type PurchaseOrderLine,
} from './data/purchase-order-queries'

const poSchema = z.object({
  poNumber: z.string().min(1, 'PO number is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  vendorId: z.string().optional(),
  orderDate: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
})

type POForm = z.infer<typeof poSchema>

const poLineSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  orderedQuantity: z.number().min(1, 'Quantity is required'),
  receivedQuantity: z.number().optional(),
  uomId: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().optional(),
  lineNumber: z.number().optional(),
})

type PoLineForm = z.infer<typeof poLineSchema>

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Open: 'default',
  Closed: 'secondary',
  Cancelled: 'destructive',
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant='outline'>Unknown</Badge>
  return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>
}

export function PurchaseOrders() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = usePurchaseOrders()
  const createMutation = useCreatePurchaseOrder()
  const updateMutation = useUpdatePurchaseOrderStatus()
  const deleteMutation = useDeletePurchaseOrder()

  const [expandedPoId, setExpandedPoId] = useState<string | null>(null)
  const [lineDialogOpen, setLineDialogOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<PurchaseOrderLine | null>(null)
  const [selectedPoIdForLines, setSelectedPoIdForLines] = useState<string | null>(null)
  const [lineToDelete, setLineToDelete] = useState<PurchaseOrderLine | null>(null)

  const { data: linesData, isLoading: linesLoading } = usePurchaseOrderLines(expandedPoId ?? '')
  const createLine = useCreatePurchaseOrderLine()
  const updateLine = useUpdatePurchaseOrderLine()
  const deleteLine = useDeletePurchaseOrderLine()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<POForm>({
    resolver: zodResolver(poSchema) as any,
    defaultValues: {
      poNumber: '',
      facilityId: '',
      vendorId: '',
      orderDate: '',
      expectedDate: '',
      notes: '',
    },
  })

  const lineForm = useForm<PoLineForm>({
    resolver: zodResolver(poLineSchema) as any,
    defaultValues: {
      productId: '',
      orderedQuantity: 1,
      receivedQuantity: 0,
      uomId: '',
      unitPrice: undefined,
      lineNumber: undefined,
    },
  })

  const orders = data?.purchaseOrders ?? []
  const filtered = orders.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return o.poNumber.toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (po?: PurchaseOrder) => {
    if (po) {
      setEditingPO(po)
      reset({
        poNumber: po.poNumber,
        facilityId: po.facilityId,
        vendorId: po.vendorId || '',
        orderDate: po.orderDate || '',
        expectedDate: po.expectedDate || '',
        notes: po.notes || '',
      })
    } else {
      setEditingPO(null)
      reset({ poNumber: '', facilityId: '', vendorId: '', orderDate: '', expectedDate: '', notes: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: POForm) => {
    try {
      if (editingPO) {
        await updateMutation.mutateAsync({ id: editingPO.id, dto: values as any })
        toast.success('Purchase order updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Purchase order created')
      }
      setDialogOpen(false)
      setEditingPO(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const onSubmitLine = async (values: PoLineForm) => {
    try {
      if (editingLine) {
        await updateLine.mutateAsync({
          id: editingLine.id,
          dto: {
            orderedQuantity: values.orderedQuantity,
            receivedQuantity: values.receivedQuantity ?? 0,
            uomId: values.uomId,
            unitPrice: values.unitPrice,
          },
        })
        toast.success('PO line updated')
      } else {
        await createLine.mutateAsync({
          poId: selectedPoIdForLines!,
          productId: values.productId,
          orderedQuantity: values.orderedQuantity,
          uomId: values.uomId,
          lineNumber: values.lineNumber ?? 1,
          unitPrice: values.unitPrice,
        } as any)
        toast.success('PO line created')
      }
      setLineDialogOpen(false)
      setEditingLine(null)
      lineForm.reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Purchase order deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Purchase Orders</h1>
          <p className='text-muted-foreground'>Manage purchase orders</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}</DialogTitle>
                <DialogDescription>
                  {editingPO ? 'Update the purchase order details below.' : 'Add a new purchase order to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='poNumber'>PO Number *</Label>
                  <Input id='poNumber' {...register('poNumber')} disabled={!!editingPO} />
                  {errors.poNumber && <p className='text-sm text-destructive'>{errors.poNumber.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='vendorId'>Vendor ID</Label>
                  <Input id='vendorId' {...register('vendorId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='orderDate'>Order Date</Label>
                  <Input id='orderDate' type='date' {...register('orderDate')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='expectedDate'>Expected Date</Label>
                  <Input id='expectedDate' type='date' {...register('expectedDate')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingPO ? 'Save Changes' : 'Create Purchase Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search purchase orders...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>{total} purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load purchase orders</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No purchase orders found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-10'></TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => setExpandedPoId(expandedPoId === po.id ? null : po.id)}>
                          {expandedPoId === po.id ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>{po.poNumber}</TableCell>
                      <TableCell>{po.facilityId}</TableCell>
                      <TableCell>{po.vendorId || '—'}</TableCell>
                      <TableCell>{po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell><StatusBadge status={po.status} /></TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(po)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(po.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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

      {expandedPoId && (
        <Card>
          <CardHeader className='py-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>PO Lines</CardTitle>
              <Button size='sm' variant='outline' onClick={() => { setSelectedPoIdForLines(expandedPoId); setEditingLine(null); lineForm.reset({ productId: '', orderedQuantity: 1, receivedQuantity: 0, uomId: '', unitPrice: undefined, lineNumber: undefined }); setLineDialogOpen(true) }}>
                <Plus className='mr-1 h-3 w-3' /> Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent className='py-2'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty Ordered</TableHead>
                  <TableHead>Qty Received</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className='w-[80px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linesLoading ? (
                  <TableRow><TableCell colSpan={7} className='py-4 text-center'><Loader2 className='mx-auto h-4 w-4 animate-spin' /></TableCell></TableRow>
                ) : linesData?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className='py-4 text-center text-muted-foreground'>No lines</TableCell></TableRow>
                ) : (
                  linesData?.map((line: any) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.lineNumber ?? '-'}</TableCell>
                      <TableCell>{line.productId}</TableCell>
                      <TableCell>{line.quantity ?? line.orderedQuantity}</TableCell>
                      <TableCell>{line.receivedQuantity ?? 0}</TableCell>
                      <TableCell>{line.uomId}</TableCell>
                      <TableCell>{line.unitCost ?? line.unitPrice ? `$${Number(line.unitCost ?? line.unitPrice).toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => { setEditingLine(line); setSelectedPoIdForLines(expandedPoId); lineForm.reset({ productId: line.productId, orderedQuantity: line.quantity ?? line.orderedQuantity ?? 1, receivedQuantity: line.receivedQuantity ?? 0, uomId: line.uomId, unitPrice: line.unitCost ?? line.unitPrice, lineNumber: line.lineNumber }); setLineDialogOpen(true) }}>
                            <Edit className='h-3.5 w-3.5' />
                          </Button>
                          <Button variant='ghost' size='icon' className='h-8 w-8 text-destructive' onClick={() => setLineToDelete(line)}>
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

      {/* PO Line Dialog */}
      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent>
          <form onSubmit={lineForm.handleSubmit(onSubmitLine)}>
            <DialogHeader>
              <DialogTitle>{editingLine ? 'Edit PO Line' : 'Add PO Line'}</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label>Product ID *</Label>
                <Input {...lineForm.register('productId')} placeholder='product-uuid' />
                {lineForm.formState.errors.productId && <p className='text-sm text-destructive'>{lineForm.formState.errors.productId.message}</p>}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label>Quantity Ordered *</Label>
                  <Input type='number' {...lineForm.register('orderedQuantity', { valueAsNumber: true })} />
                  {lineForm.formState.errors.orderedQuantity && <p className='text-sm text-destructive'>{lineForm.formState.errors.orderedQuantity.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label>UOM *</Label>
                  <Input {...lineForm.register('uomId')} placeholder='EA, CS, PLT' />
                  {lineForm.formState.errors.uomId && <p className='text-sm text-destructive'>{lineForm.formState.errors.uomId.message}</p>}
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label>Unit Price</Label>
                  <Input type='number' step='0.01' {...lineForm.register('unitPrice', { valueAsNumber: true })} placeholder='0.00' />
                </div>
                <div className='grid gap-2'>
                  <Label>Line #</Label>
                  <Input type='number' {...lineForm.register('lineNumber', { valueAsNumber: true })} placeholder='Auto' />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setLineDialogOpen(false)}>Cancel</Button>
              <Button type='submit' disabled={createLine.isPending || updateLine.isPending}>
                {editingLine ? 'Update' : 'Create'} Line
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Line Confirmation */}
      <AlertDialog open={!!lineToDelete} onOpenChange={(open) => !open && setLineToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PO Line?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove line #{(lineToDelete as any)?.lineNumber ?? ''} ({(lineToDelete as any)?.productId}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteLine.mutate((lineToDelete as any).id); setLineToDelete(null) }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
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
