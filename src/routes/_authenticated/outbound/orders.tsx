import { useCallback, useMemo, useState } from 'react'
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
  type PaginationState,
} from '@tanstack/react-table'
import { EyeIcon, SearchIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTable, DataTableLoading } from '@/components/data-table/data-table'
import {
  useOrdersList,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_LABELS,
} from '@/features/outbound/data/order-queries'
import { OrderDetailDrawer } from '@/features/outbound/components/order-detail-drawer'
import type { SalesOrderDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/outbound/orders')({
  component: OrdersPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
    status: (search.status as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<SalesOrderDto>()

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'ALLOCATED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'PICKING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'PACKED':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'SHIPPED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

function OrdersPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const { page, limit, q, status } = search

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useOrdersList({
    page,
    limit,
    search: q || undefined,
    status: status || undefined,
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('order_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order #" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue('order_number')}</span>,
      }),
      columnHelper.accessor('customer_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ getValue }) => <span>{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('order_date', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order Date" />,
        cell: ({ getValue }) => {
          const val = getValue()
          return <span className="text-sm text-muted-foreground">{val ? new Date(val as string).toLocaleDateString() : '-'}</span>
        },
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const val = row.getValue('status') as string | undefined
          return <Badge className={statusBadgeClass(val)}>{ORDER_STATUS_LABELS[val ?? ''] ?? val ?? '-'}</Badge>
        },
      }),
      columnHelper.accessor('total_lines', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Lines" />,
        cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue() ?? '-'}</span>,
      }),
      columnHelper.accessor('priority', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
        cell: ({ getValue }) => {
          const val = getValue() as number | undefined
          return <span className="text-sm">{val != null ? `P${val}` : '-'}</span>
        },
      }),
      columnHelper.accessor('total_order_quantity', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Qty" />,
        cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue() ?? '-'}</span>,
      }),
      columnHelper.accessor('total_order_value', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
        cell: ({ row }) => {
          const val = row.original.total_order_value
          const currency = row.original.currency_code
          return <span className="tabular-nums text-sm">{val != null ? `${currency ?? ''} ${Number(val).toFixed(2)}` : '-'}</span>
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const id = row.original.order_id
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedOrderId(id)
                setDrawerOpen(true)
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          )
        },
      }),
    ],
    [],
  )

  const orders = data?.data ?? []
  const total = data?.total ?? 0

  const table = useReactTable({
    data: orders,
    columns,
    pageCount: Math.ceil(total / limit),
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  const handlePaginationChange = useCallback(
    (newPagination: PaginationState) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          page: newPagination.pageIndex + 1,
          limit: newPagination.pageSize,
        }),
      })
    },
    [navigate],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          q: value || undefined,
          page: 1,
        }),
      })
    },
    [navigate],
  )

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          status: value || undefined,
          page: 1,
        }),
      })
    },
    [navigate],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage incoming orders, check fulfillment status, and initiate outbound workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search order #, customer..."
                  className="w-72 pl-8"
                  value={q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <XIcon className="h-3 w-3" /> All statuses
                    </div>
                  </SelectItem>
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {ORDER_STATUS_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DataTableToolbar>

          {isLoading ? (
            <DataTableLoading />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <p className="text-sm font-medium">Failed to load orders</p>
              {error && <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable table={table} columns={columns} />
          )}

          <DataTablePagination table={table} onPaginationChange={handlePaginationChange} />
        </CardContent>
      </Card>

      <OrderDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        orderId={selectedOrderId}
      />
    </div>
  )
}
