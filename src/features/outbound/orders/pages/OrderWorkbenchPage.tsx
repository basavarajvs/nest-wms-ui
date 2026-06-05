import { useState, useMemo, useCallback, Fragment } from 'react'
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
import type { OrderStatus } from '@/types/warehouse-statuses'
import {
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Eye,
  Waves,
  XCircle,
  Loader2,
  Layers,
  ShoppingCart,
  Package,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { OrderStatusBadge } from '@/components/status-badges'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useOrders,
  useCancelOrder,
  type Order,
} from '@/features/outbound/orders/data/order-queries'
import { useOrderLines, type OrderLine } from '@/features/outbound/orders/data/order-line-queries'
import { SalesOrderDetailsDialog } from '@/features/outbound/orders/components/SalesOrderDetailsDialog'
import { OverrideAllocationDialog } from '@/features/outbound/orders/components/OverrideAllocationDialog'
import { WaveAssignmentDialog } from './WaveAssignmentDialog'

const STATUS_FILTER_OPTIONS = [
  { label: 'Created', value: 'created' },
  { label: 'Validated', value: 'validated' },
  { label: 'Allocated', value: 'allocated' },
  { label: 'Released', value: 'released' },
  { label: 'Picked', value: 'picked' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
]

const STATS_CARD_STYLES = {
  total: { label: 'Total Orders', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/50' },
  pendingAllocation: { label: 'Pending Allocation', bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/50' },
  allocated: { label: 'Allocated', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/50' },
  inWave: { label: 'In Wave', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/50' },
  picked: { label: 'Picked', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', iconBg: 'bg-indigo-100 dark:bg-indigo-900/50' },
  packed: { label: 'Packed', bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-900/50' },
  shipped: { label: 'Shipped', bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', iconBg: 'bg-green-100 dark:bg-green-900/50' },
}

const STATS_ICONS: Record<string, typeof ShoppingCart> = {
  total: ShoppingCart,
  pendingAllocation: Layers,
  allocated: Package,
  inWave: Waves,
  picked: Package,
  packed: Layers,
  shipped: Truck,
}

function OrderLinesSubTable({ orderId }: { orderId: string }) {
  const { data: linesData, isLoading } = useOrderLines(orderId)
  const lines: OrderLine[] = linesData?.lines ?? []

  const subColumns: ColumnDef<OrderLine, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.productName || row.original.productSku || row.original.productId}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Ordered' className='text-right' />,
        cell: ({ row }) => <span className='font-mono'>{row.original.quantity}</span>,
        meta: { className: 'text-right' },
      },
      {
        accessorKey: 'allocatedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Allocated' className='text-right' />,
        cell: ({ row }) => <span className='font-mono'>{row.original.allocatedQuantity ?? 0}</span>,
      },
      {
        accessorKey: 'pickedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Picked' className='text-right' />,
        cell: ({ row }) => <span className='font-mono'>{row.original.pickedQuantity ?? 0}</span>,
      },
      {
        accessorKey: 'packedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Packed' className='text-right' />,
        cell: ({ row }) => <span className='font-mono'>{row.original.packedQuantity ?? 0}</span>,
      },
      {
        id: 'shippedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Shipped' className='text-right' />,
        cell: ({ row }) => <span className='font-mono'>{row.original.shippedQuantity ?? 0}</span>,
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='UOM' />,
      },
      {
        accessorKey: 'unitPrice',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Unit Price' className='text-right' />,
        cell: ({ row }) => <span className='font-mono'>${(row.original.unitPrice || 0).toFixed(2)}</span>,
      },
      {
        id: 'lineTotal',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Line Total' className='text-right' />,
        cell: ({ row }) => {
          const total = (row.original.quantity || 0) * (row.original.unitPrice || 0)
          return <span className='font-mono font-medium'>${total.toFixed(2)}</span>
        },
      },
    ],
    []
  )

  const subTable = useReactTable({
    data: lines,
    columns: subColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className='bg-muted/50 p-4'>
        <div className='flex items-center justify-center py-6'>
          <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className='bg-muted/50 p-4'>
        <p className='text-center text-sm text-muted-foreground'>No line items found.</p>
      </div>
    )
  }

  const totalQty = lines.reduce((s, l) => s + (l.quantity || 0), 0)
  const totalAllocated = lines.reduce((s, l) => s + (l.allocatedQuantity || 0), 0)
  const totalPicked = lines.reduce((s, l) => s + (l.pickedQuantity || 0), 0)
  const totalPacked = lines.reduce((s, l) => s + (l.packedQuantity || 0), 0)
  const totalShipped = lines.reduce((s, l) => s + (l.shippedQuantity || 0), 0)
  const allocatedPct = totalQty > 0 ? ((totalAllocated / totalQty) * 100).toFixed(0) : '0'
  const pickedPct = totalQty > 0 ? ((totalPicked / totalQty) * 100).toFixed(0) : '0'
  const packedPct = totalQty > 0 ? ((totalPacked / totalQty) * 100).toFixed(0) : '0'
  const shippedPct = totalQty > 0 ? ((totalShipped / totalQty) * 100).toFixed(0) : '0'

  return (
    <div className='bg-muted/50 p-4'>
      <div className='mb-3 grid grid-cols-4 gap-3 text-sm'>
        <div className='rounded-md border bg-background px-3 py-2'>
          <span className='text-muted-foreground'>Allocated: </span>
          <span className='font-medium'>{allocatedPct}%</span>
        </div>
        <div className='rounded-md border bg-background px-3 py-2'>
          <span className='text-muted-foreground'>Picked: </span>
          <span className='font-medium'>{pickedPct}%</span>
        </div>
        <div className='rounded-md border bg-background px-3 py-2'>
          <span className='text-muted-foreground'>Packed: </span>
          <span className='font-medium'>{packedPct}%</span>
        </div>
        <div className='rounded-md border bg-background px-3 py-2'>
          <span className='text-muted-foreground'>Shipped: </span>
          <span className='font-medium'>{shippedPct}%</span>
        </div>
      </div>
      <Table>
        <TableHeader>
          {subTable.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {subTable.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function OrderWorkbenchPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [detailsDialogOrder, setDetailsDialogOrder] = useState<Order | null>(null)
  const [waveDialogOrder, setWaveDialogOrder] = useState<Order | null>(null)
  const [overrideDialogOrder, setOverrideDialogOrder] = useState<Order | null>(null)
  const cancelOrder = useCancelOrder()
  const { data, isLoading, isError, error, refetch, isFetching } = useOrders({
    page: 1,
    limit: 100,
    status: '',
    clientCode: '',
  })
  const { selectedFacility } = useFacility()

  const orders: Order[] = data?.orders || []

  const stats = useMemo(() => {
    const pendingAllocation = orders.filter(
      (o) => o.status?.toLowerCase() === 'created' || o.status?.toLowerCase() === 'validated'
    ).length
    const allocated = orders.filter((o) => o.status?.toLowerCase() === 'allocated').length
    const inWave = orders.filter((o) => o.status?.toLowerCase() === 'released').length
    const picked = orders.filter((o) => o.status?.toLowerCase() === 'picked').length
    const packed = orders.filter((o) => o.status?.toLowerCase() === 'packed').length
    const shipped = orders.filter((o) => o.status?.toLowerCase() === 'shipped').length
    return {
      total: orders.length,
      pendingAllocation,
      allocated,
      inWave,
      picked,
      packed,
      shipped,
    }
  }, [orders])

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const columns: ColumnDef<Order, any>[] = useMemo(
    () => [
      {
        id: 'expander',
        header: '',
        cell: ({ row }) => (
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={() => handleToggleExpand(row.original.id)}
          >
            {expandedRows.has(row.original.id) ? (
              <ChevronDown className='h-4 w-4' />
            ) : (
              <ChevronRight className='h-4 w-4' />
            )}
          </Button>
        ),
      },
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Order #' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-sm font-medium'>
            {row.getValue('orderNumber') || row.original.id.substring(0, 12) + '...'}
          </span>
        ),
      },
      {
        accessorKey: 'clientCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Client' />
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <OrderStatusBadge
            status={
              ((row.getValue('status') as string)?.toUpperCase() as OrderStatus) ||
              (row.getValue('status') as OrderStatus)
            }
          />
        ),
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Priority' />
        ),
        cell: ({ row }) => {
          const priority = row.getValue('priority') as number | null | undefined
          return priority != null ? (
            <Badge
              variant={
                priority >= 5
                  ? 'destructive'
                  : priority >= 3
                    ? 'default'
                    : 'secondary'
              }
            >
              {priority}
            </Badge>
          ) : (
            '—'
          )
        },
      },
      {
        id: 'itemCount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Items' />
        ),
        cell: () => <span className='text-muted-foreground'>—</span>,
      },
      {
        id: 'totalQty',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Total Qty' />
        ),
        cell: () => <span className='text-muted-foreground'>—</span>,
      },
      {
        id: 'allocatedPct',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Alloc %' />
        ),
        cell: () => <span className='text-muted-foreground'>—</span>,
      },
      {
        id: 'fulfilledPct',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Fulfilled %' />
        ),
        cell: () => <span className='text-muted-foreground'>—</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const order = row.original
          const isCreated = order.status?.toLowerCase() === 'created'
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setDetailsDialogOrder(order)}>
                  <Eye className='mr-2 h-4 w-4' />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setWaveDialogOrder(order)}>
                  <Waves className='mr-2 h-4 w-4' />
                  Assign to Wave
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOverrideDialogOrder(order)}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Override Allocation
                </DropdownMenuItem>
                {isCreated && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className='text-destructive'
                      disabled={cancelOrder.isPending}
                      onClick={async () => {
                        try {
                          await cancelOrder.mutateAsync(order.id)
                          toast.success('Order cancelled')
                        } catch (err: any) {
                          toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel order')
                        }
                      }}
                    >
                      <XCircle className='mr-2 h-4 w-4' />
                      Cancel Order
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [expandedRows, handleToggleExpand]
  )

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      globalFilter: tableUrlState.globalFilter ?? '',
      columnFilters: tableUrlState.columnFilters,
      pagination: tableUrlState.pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onColumnFiltersChange: tableUrlState.onColumnFiltersChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Order Workbench</h1>
          <p className='text-muted-foreground'>
            Consolidated view of all outbound orders
          </p>
        </div>
        <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-7'>
        {(['total', 'pendingAllocation', 'allocated', 'inWave', 'picked', 'packed', 'shipped'] as const).map((key) => {
          const config = STATS_CARD_STYLES[key]
          const count = stats[key]
          const Icon = STATS_ICONS[key]
          return (
            <Card key={key} className={cn(config.bg, 'border-0')}>
              <CardContent className='p-3'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className={cn('text-xl font-bold', config.text)}>{count}</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>{config.label}</p>
                  </div>
                  <div className={cn('rounded-lg p-1.5', config.iconBg)}>
                    <Icon className={cn('h-4 w-4', config.text)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <DataTableToolbar
        table={table}
        searchKey='clientCode'
        searchPlaceholder='Filter by order # or client...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
      />

      {/* Orders Table */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Orders ({orders.length})</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load orders</p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <p className='font-medium text-muted-foreground'>No orders found</p>
              <p className='max-w-md text-sm text-muted-foreground'>
                {tableUrlState.globalFilter || tableUrlState.columnFilters.length > 0
                  ? 'No orders match the current filters.'
                  : 'Create a sales order to get started.'}
              </p>
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
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <Fragment key={row.id}>
                        <TableRow>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                        {expandedRows.has(row.original.id) && (
                          <TableRow>
                            <TableCell colSpan={columns.length} className='p-0'>
                              <OrderLinesSubTable orderId={row.original.id} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {detailsDialogOrder && (
        <SalesOrderDetailsDialog
          order={detailsDialogOrder}
          open={!!detailsDialogOrder}
          onOpenChange={(open) => { if (!open) setDetailsDialogOrder(null) }}
        />
      )}

      {waveDialogOrder && (
        <WaveAssignmentDialog
          orderId={waveDialogOrder.id}
          orderNumber={waveDialogOrder.orderNumber}
          open={!!waveDialogOrder}
          onOpenChange={(open) => { if (!open) setWaveDialogOrder(null) }}
        />
      )}

      {overrideDialogOrder && (
        <OverrideAllocationDialog
          orderId={overrideDialogOrder.id}
          orderNumber={overrideDialogOrder.orderNumber}
          open={!!overrideDialogOrder}
          onOpenChange={(open) => { if (!open) setOverrideDialogOrder(null) }}
        />
      )}
    </div>
  )
}
