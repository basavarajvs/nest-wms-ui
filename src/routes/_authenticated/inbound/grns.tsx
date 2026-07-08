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
  useGrnsList,
  GRN_STATUS_OPTIONS,
  GRN_STATUS_LABELS,
} from '@/features/inbound/data/grn-queries'
import { GrnDetailDrawer } from '@/features/inbound/components/grn-detail-drawer'
import type { GoodsReceiptResponseDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/inbound/grns')({
  component: GrnsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
    status: (search.status as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<GoodsReceiptResponseDto>()

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'IN_PROGRESS':
    case 'IN_RECEIVING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'PARTIALLY_RECEIVED':
    case 'RECEIVED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

function GrnsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const { page, limit, q, status } = search

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedGrnId, setSelectedGrnId] = useState<string | null>(null)

  const { data: grnsData, isLoading, isError, refetch } = useGrnsList({
    page,
    limit,
    search: q || undefined,
    status: status || undefined,
  })

  const columns = useMemo(
    () => [
      columnHelper.accessor('receipt_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="GRN #" />,
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('receipt_number')}</span>
        ),
      }),
      columnHelper.accessor('asn_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="ASN" />,
      }),
      columnHelper.accessor('po_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="PO" />,
      }),
      columnHelper.accessor('vendor_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
      }),
      columnHelper.accessor('received_date', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const val = row.getValue('status') as string
          return <Badge className={statusBadgeClass(val)}>{GRN_STATUS_LABELS[val] ?? val}</Badge>
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const grnId = String(row.original.receipt_id)
          return (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedGrnId(grnId)
                  setDrawerOpen(true)
                }}
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: grnsData?.data ?? [],
    columns,
    pageCount: grnsData ? Math.ceil(grnsData.total / limit) : -1,
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
    manualSorting: true,
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
        <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes</h1>
        <p className="text-sm text-muted-foreground">
          View and manage received shipments linked to ASNs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">GRNs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search GRN, ASN, PO, Vendor..."
                  className="w-72 pl-8"
                  value={q}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Select value={status} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <XIcon className="h-3 w-3" /> All statuses
                    </div>
                  </SelectItem>
                  {GRN_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {GRN_STATUS_LABELS[opt]}
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
              <p className="text-sm font-medium">Failed to load GRNs</p>
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

      <GrnDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        grnId={selectedGrnId}
      />
    </div>
  )
}
