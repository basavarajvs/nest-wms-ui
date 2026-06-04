import { useState, useMemo } from 'react'
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
import { Plus, RefreshCw, Layers, MoreHorizontal, Eye } from 'lucide-react'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useOrders,
  type Order,
} from '@/features/outbound/orders/data/order-queries'
import { OrderLineItemsDialog } from '@/features/outbound/orders/components/OrderLineItemsDialog'
import { SalesOrderCreateWizard } from '@/features/outbound/orders/components/SalesOrderCreateWizard'
import { SalesOrderDetailsDialog } from '@/features/outbound/orders/components/SalesOrderDetailsDialog'

const STATUS_FILTER_OPTIONS = [
  { label: 'Created', value: 'created' },
  { label: 'Validated', value: 'validated' },
  { label: 'Allocated', value: 'allocated' },
  { label: 'Released', value: 'released' },
  { label: 'Picked', value: 'picked' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function OrderList() {
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
  const [createWizardOpen, setCreateWizardOpen] = useState(false)
  const [detailsDialogOrder, setDetailsDialogOrder] = useState<Order | null>(null)
  const [linesDialogOrder, setLinesDialogOrder] = useState<Order | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useOrders({
    page: 1,
    limit: 100,
    status: '',
    clientCode: '',
  })
  const { selectedFacility } = useFacility()

  const orders: Order[] = data?.orders || []

  const columns: ColumnDef<Order, any>[] = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Order #' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-sm font-medium'>
            {row.getValue('orderNumber') ||
              row.original.id.substring(0, 12) + '...'}
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
        accessorKey: 'orderType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground capitalize'>
            {row.getValue('orderType') || '—'}
          </span>
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
              ((
                row.getValue('status') as string
              )?.toUpperCase() as OrderStatus) ||
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
        accessorKey: 'requestedDeliveryDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Requested Date' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('requestedDeliveryDate') as
            | string
            | undefined
          return date ? new Date(date).toLocaleDateString() : '—'
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const order = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailsDialogOrder(order)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinesDialogOrder(order)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Manage Lines
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
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
          <h1 className='text-2xl font-bold tracking-tight'>Sales Orders</h1>
          <p className='text-muted-foreground'>
            Manage outbound customer orders
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setCreateWizardOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Create Order
          </Button>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchKey='clientCode'
        searchPlaceholder='Filter by client code...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
      />

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
              <p className='font-medium text-destructive'>
                Failed to load orders
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <p className='font-medium text-muted-foreground'>
                No orders found
              </p>
              <p className='max-w-md text-sm text-muted-foreground'>
                {tableUrlState.globalFilter || tableUrlState.columnFilters.length > 0
                  ? 'No orders match the current filters. Try clearing filters.'
                  : 'Create your first sales order to get started.'}
              </p>
              {!tableUrlState.globalFilter && tableUrlState.columnFilters.length === 0 && (
                <Button size='sm' onClick={() => setCreateWizardOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' /> Create Order
                </Button>
              )}
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
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      {detailsDialogOrder && (
        <SalesOrderDetailsDialog
          order={detailsDialogOrder}
          open={!!detailsDialogOrder}
          onOpenChange={(open) => { if (!open) setDetailsDialogOrder(null) }}
        />
      )}

      {linesDialogOrder && (
        <OrderLineItemsDialog
          orderId={linesDialogOrder.id}
          orderStatus={linesDialogOrder.status}
          open={!!linesDialogOrder}
          onOpenChange={(open) => { if (!open) setLinesDialogOrder(null) }}
        />
      )}

      <SalesOrderCreateWizard
        open={createWizardOpen}
        onOpenChange={setCreateWizardOpen}
      />
    </div>
  )
}
