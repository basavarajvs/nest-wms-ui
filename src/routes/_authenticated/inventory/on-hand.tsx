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
import { SearchIcon, XIcon } from 'lucide-react'
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
  useCurrentInventoryList,
  useProductLookup,
  useLocationLookup,
  computeAvailableQty,
  INVENTORY_STATUS_OPTIONS,
  INVENTORY_STATUS_LABELS,
} from '@/features/inventory/data/inventory-queries'
import type { InventoryOnHandResponseDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/inventory/on-hand')({
  component: OnHandPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
    product_id: (search.product_id as string) ?? '',
    location_id: (search.location_id as string) ?? '',
    status: (search.status as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<InventoryOnHandResponseDto>()

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'IN_STOCK':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'ALLOCATED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'ON_HOLD':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'DAMAGED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'OUT_OF_STOCK':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

function OnHandPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const { page, limit, q, product_id, location_id, status } = search

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const { data, isLoading, isError, error, refetch } = useCurrentInventoryList({
    page,
    limit,
    search: q || undefined,
    product_id: product_id || undefined,
    location_id: location_id || undefined,
    status: status || undefined,
  })

  const { data: productOptions = [] } = useProductLookup()
  const { data: locationOptions = [] } = useLocationLookup()

  const columns = useMemo(
    () => [
      columnHelper.accessor('product_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('lpn_code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="LPN" />,
        cell: ({ getValue }) => <span className="text-sm font-mono">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('location_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
        cell: ({ getValue }) => <span className="text-sm font-mono">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('lot_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Lot #" />,
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('quantity_on_hand', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="On Hand" />,
        cell: ({ getValue }) => <span className="font-medium tabular-nums">{getValue()}</span>,
      }),
      columnHelper.display({
        id: 'available_qty',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Available" />,
        cell: ({ row }) => {
          const qty = computeAvailableQty(row.original)
          return <span className="tabular-nums">{qty}</span>
        },
      }),
      columnHelper.accessor('quantity_allocated', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Allocated" />,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
      }),
      columnHelper.accessor('inbound_qty', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Inbound" />,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue() ?? '-'}</span>,
      }),
      columnHelper.accessor('quantity_picked', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Picked" />,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
      }),
      columnHelper.accessor('quantity_on_hold', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="On Hold" />,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
      }),
      columnHelper.accessor('quantity_damaged', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Damaged" />,
        cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
      }),
      columnHelper.accessor('uom_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="UOM" />,
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const val = row.getValue('status') as string | undefined
          if (!val) return <span className="text-sm text-muted-foreground">-</span>
          return <Badge className={statusBadgeClass(val)}>{INVENTORY_STATUS_LABELS[val] ?? val}</Badge>
        },
      }),
      columnHelper.accessor('updated_at', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
        cell: ({ getValue }) => {
          const val = getValue()
          return <span className="text-sm text-muted-foreground">{val ? new Date(val as string).toLocaleDateString() : '-'}</span>
        },
      }),
    ],
    [],
  )

  const records = data?.data ?? []
  const total = data?.total ?? 0

  const table = useReactTable({
    data: records,
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

  const handleProductFilterChange = useCallback(
    (value: string) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          product_id: value || undefined,
          page: 1,
        }),
      })
    },
    [navigate],
  )

  const handleLocationFilterChange = useCallback(
    (value: string) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          location_id: value || undefined,
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

  const clearFilters = useCallback(() => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: undefined,
        product_id: undefined,
        location_id: undefined,
        status: undefined,
        page: 1,
      }),
    })
  }, [navigate])

  const hasFilters = q || product_id || location_id || status

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Current Inventory</h1>
        <p className="text-sm text-muted-foreground">
          On-hand stock levels by product and location for the selected facility.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">On Hand</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, lot #..."
                  className="w-56 pl-8"
                  value={q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={product_id} onValueChange={handleProductFilterChange}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <XIcon className="h-3 w-3" /> All products
                    </div>
                  </SelectItem>
                  {productOptions.map((opt) => (
                    <SelectItem key={opt.product_id} value={String(opt.product_id)}>
                      {opt.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={location_id} onValueChange={handleLocationFilterChange}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <XIcon className="h-3 w-3" /> All locations
                    </div>
                  </SelectItem>
                  {locationOptions.map((opt) => (
                    <SelectItem key={opt.location_id} value={String(opt.location_id)}>
                      {opt.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {INVENTORY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <XIcon className="h-3 w-3 mr-1" /> Clear filters
                </Button>
              )}
            </div>
          </DataTableToolbar>

          {isLoading ? (
            <DataTableLoading />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-destructive">
              <p className="text-sm font-medium">Failed to load inventory</p>
              {error && <p className="text-xs text-muted-foreground mt-1">{(error as Error).message}</p>}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : records.length === 0 && hasFilters ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No inventory matches the current filters.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <DataTable table={table} columns={columns} />
          )}

          <DataTablePagination table={table} onPaginationChange={handlePaginationChange} />
        </CardContent>
      </Card>
    </div>
  )
}
