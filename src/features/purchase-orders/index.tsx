import React, { useState, useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
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

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  Open: 'default',
  Closed: 'secondary',
  Cancelled: 'destructive',
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant='outline'>Unknown</Badge>
  return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>
}

function PoLinesSubTable({ poId }: { poId: string }) {
  const { data: linesData, isLoading: linesLoading } =
    usePurchaseOrderLines(poId)
  const deleteLine = useDeletePurchaseOrderLine()
  const [lineDialogOpen, setLineDialogOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<PurchaseOrderLine | null>(null)
  const [lineToDelete, setLineToDelete] = useState<PurchaseOrderLine | null>(
    null
  )

  const createLine = useCreatePurchaseOrderLine()
  const updateLine = useUpdatePurchaseOrderLine()
  const { refetch } = usePurchaseOrders()

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
          poId,
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
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Operation failed'
      )
    }
  }

  return (
    <div className='bg-muted/50 p-4'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-sm font-medium'>PO Lines</span>
        <Button
          size='sm'
          variant='outline'
          onClick={() => {
            setEditingLine(null)
            lineForm.reset({
              productId: '',
              orderedQuantity: 1,
              receivedQuantity: 0,
              uomId: '',
              unitPrice: undefined,
              lineNumber: undefined,
            })
            setLineDialogOpen(true)
          }}
        >
          <Plus className='mr-1 h-3 w-3' /> Add Line
        </Button>
      </div>
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
            <TableRow>
              <TableCell colSpan={7} className='py-4 text-center'>
                <Loader2 className='mx-auto h-4 w-4 animate-spin' />
              </TableCell>
            </TableRow>
          ) : !linesData || linesData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className='py-4 text-center text-muted-foreground'
              >
                No lines
              </TableCell>
            </TableRow>
          ) : (
            linesData?.map((line: any) => (
              <TableRow key={line.id}>
                <TableCell>{line.lineNumber ?? '-'}</TableCell>
                <TableCell>{line.productId}</TableCell>
                <TableCell>{line.quantity ?? line.orderedQuantity}</TableCell>
                <TableCell>{line.receivedQuantity ?? 0}</TableCell>
                <TableCell>{line.uomId}</TableCell>
                <TableCell>
                  {(line.unitCost ?? line.unitPrice)
                    ? `$${Number(line.unitCost ?? line.unitPrice).toFixed(2)}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8'
                      onClick={() => {
                        setEditingLine(line)
                        lineForm.reset({
                          productId: line.productId,
                          orderedQuantity:
                            line.quantity ?? line.orderedQuantity ?? 1,
                          receivedQuantity: line.receivedQuantity ?? 0,
                          uomId: line.uomId,
                          unitPrice: line.unitCost ?? line.unitPrice,
                          lineNumber: line.lineNumber,
                        })
                        setLineDialogOpen(true)
                      }}
                    >
                      <Edit className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-destructive'
                      onClick={() => setLineToDelete(line)}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent>
          <form onSubmit={lineForm.handleSubmit(onSubmitLine)}>
            <DialogHeader>
              <DialogTitle>
                {editingLine ? 'Edit PO Line' : 'Add PO Line'}
              </DialogTitle>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label>Product ID *</Label>
                <Input
                  {...lineForm.register('productId')}
                  placeholder='product-uuid'
                />
                {lineForm.formState.errors.productId && (
                  <p className='text-sm text-destructive'>
                    {lineForm.formState.errors.productId.message}
                  </p>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label>Quantity Ordered *</Label>
                  <Input
                    type='number'
                    {...lineForm.register('orderedQuantity', {
                      valueAsNumber: true,
                    })}
                  />
                  {lineForm.formState.errors.orderedQuantity && (
                    <p className='text-sm text-destructive'>
                      {lineForm.formState.errors.orderedQuantity.message}
                    </p>
                  )}
                </div>
                <div className='grid gap-2'>
                  <Label>UOM *</Label>
                  <Input
                    {...lineForm.register('uomId')}
                    placeholder='EA, CS, PLT'
                  />
                  {lineForm.formState.errors.uomId && (
                    <p className='text-sm text-destructive'>
                      {lineForm.formState.errors.uomId.message}
                    </p>
                  )}
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label>Unit Price</Label>
                  <Input
                    type='number'
                    step='0.01'
                    {...lineForm.register('unitPrice', { valueAsNumber: true })}
                    placeholder='0.00'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label>Line #</Label>
                  <Input
                    type='number'
                    {...lineForm.register('lineNumber', {
                      valueAsNumber: true,
                    })}
                    placeholder='Auto'
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setLineDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={createLine.isPending || updateLine.isPending}
              >
                {editingLine ? 'Update' : 'Create'} Line
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!lineToDelete}
        onOpenChange={(open) => !open && setLineToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PO Line?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove line #{(lineToDelete as any)?.lineNumber ?? ''} (
              {(lineToDelete as any)?.productId}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteLine.mutate((lineToDelete as any).id)
                setLineToDelete(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function PurchaseOrders() {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = usePurchaseOrders()
  const createMutation = useCreatePurchaseOrder()
  const updateMutation = useUpdatePurchaseOrderStatus()
  const deleteMutation = useDeletePurchaseOrder()

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

  const orders = data?.purchaseOrders ?? []

  const columns: ColumnDef<PurchaseOrder, any>[] = useMemo(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => {
          return (
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => {
                const newExpanded = new Set(expandedRows)
                if (newExpanded.has(row.original.id)) {
                  newExpanded.delete(row.original.id)
                } else {
                  newExpanded.add(row.original.id)
                }
                setExpandedRows(newExpanded)
              }}
            >
              {expandedRows.has(row.original.id) ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )}
            </Button>
          )
        },
      },
      {
        accessorKey: 'poNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='PO Number' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('poNumber')}</span>
        ),
      },
      {
        accessorKey: 'facilityId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Facility' />
        ),
      },
      {
        accessorKey: 'vendorId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Vendor' />
        ),
      },
      {
        accessorKey: 'orderDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Order Date' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('orderDate') as string | undefined
          return date ? new Date(date).toLocaleDateString() : '—'
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const po = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => openDialog(po)}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setDeleteId(po.id)}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          )
        },
      },
    ],
    [expandedRows]
  )

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      globalFilter: tableUrlState.globalFilter ?? '',
      pagination: tableUrlState.pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

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
      reset({
        poNumber: '',
        facilityId: '',
        vendorId: '',
        orderDate: '',
        expectedDate: '',
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: POForm) => {
    try {
      if (editingPO) {
        await updateMutation.mutateAsync({
          id: editingPO.id,
          dto: values as any,
        })
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
      toast.error(
        err?.response?.data?.message || err?.message || 'Operation failed'
      )
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
                <DialogTitle>
                  {editingPO
                    ? 'Edit Purchase Order'
                    : 'Create New Purchase Order'}
                </DialogTitle>
                <DialogDescription>
                  {editingPO
                    ? 'Update the purchase order details below.'
                    : 'Add a new purchase order to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='poNumber'>PO Number *</Label>
                  <Input
                    id='poNumber'
                    {...register('poNumber')}
                    disabled={!!editingPO}
                  />
                  {errors.poNumber && (
                    <p className='text-sm text-destructive'>
                      {errors.poNumber.message}
                    </p>
                  )}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && (
                    <p className='text-sm text-destructive'>
                      {errors.facilityId.message}
                    </p>
                  )}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='vendorId'>Vendor ID</Label>
                  <Input id='vendorId' {...register('vendorId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='orderDate'>Order Date</Label>
                  <Input
                    id='orderDate'
                    type='date'
                    {...register('orderDate')}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='expectedDate'>Expected Date</Label>
                  <Input
                    id='expectedDate'
                    type='date'
                    {...register('expectedDate')}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={
                    isSubmitting ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {editingPO ? 'Save Changes' : 'Create Purchase Order'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Search purchase orders...'
      />

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>{orders.length} purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load purchase orders
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              No purchase orders found.
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <React.Fragment key={row.id}>
                        <TableRow>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has(row.original.id) && (
                          <TableRow>
                            <TableCell colSpan={columns.length} className='p-0'>
                              <PoLinesSubTable poId={row.original.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
