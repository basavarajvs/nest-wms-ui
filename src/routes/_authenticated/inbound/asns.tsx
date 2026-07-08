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
import { EditIcon, EyeIcon, PlusIcon, SearchIcon, Trash2Icon, XIcon } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/common/dialogs/confirm-dialog'
import {
  useAsnsList,
  useDeleteAsn,
  ASN_STATUS_OPTIONS,
  ASN_STATUS_LABELS,
} from '@/features/asns/data/asn-queries'
import type { AdvanceShipNoticeDto } from '@/lib/wms-api/types/wms-api'
import { CreateAsnWizard } from '@/features/asns/components/create-asn-wizard'
import { EditAsnDialog } from '@/features/asns/components/edit-asn-dialog'
import { AsnDetailDrawer } from '@/features/asns/components/asn-detail-drawer'

export const Route = createFileRoute('/_authenticated/inbound/asns')({
  component: AsnsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
    status: (search.status as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<AdvanceShipNoticeDto>()

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'CREATED':
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'IN_TRANSIT':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'ARRIVED':
    case 'IN_RECEIVING':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
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

function AsnsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [searchInput, setSearchInput] = useState(search.q)
  const [statusFilter, setStatusFilter] = useState(search.status)

  const [createOpen, setCreateOpen] = useState(false)
  const [editAsn, setEditAsn] = useState<AdvanceShipNoticeDto | null>(null)
  const [detailAsnId, setDetailAsnId] = useState<string | null>(null)
  const [deleteAsn, setDeleteAsn] = useState<AdvanceShipNoticeDto | null>(null)

  const { data, isLoading, isError, error, refetch } = useAsnsList({
    page: search.page,
    limit: search.limit,
    search: search.q,
    status: search.status,
  })

  const deleteMutation = useDeleteAsn()

  const asns = data?.data ?? []
  const total = data?.total ?? 0

  const handleDelete = useCallback(() => {
    if (!deleteAsn) return
    deleteMutation.mutate(String(deleteAsn.asn_id), {
      onSuccess: () => setDeleteAsn(null),
    })
  }, [deleteAsn, deleteMutation])

  const navigateWithParams = useCallback(
    (params: Partial<{ page: number; limit: number; q: string; status: string }>) => {
      navigate({
        to: '/inbound/asns',
        search: (prev: typeof search) => ({ ...prev, ...params }),
      })
    },
    [navigate],
  )

  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value)
      navigateWithParams({ q: value, page: 1 })
    },
    [navigateWithParams],
  )

  const clearSearch = useCallback(() => {
    setSearchInput('')
    navigateWithParams({ q: '', page: 1 })
  }, [navigateWithParams])

  const handleStatusFilter = useCallback(
    (value: string) => {
      setStatusFilter(value)
      navigateWithParams({ status: value === 'all' ? '' : value, page: 1 })
    },
    [navigateWithParams],
  )

  const pagination = useMemo(
    () => ({ pageIndex: search.page - 1, pageSize: search.limit }),
    [search.page, search.limit],
  )

  const onPaginationChange = useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      navigateWithParams({
        page: newPagination.pageIndex + 1,
        limit: newPagination.pageSize,
      })
    },
    [navigateWithParams, pagination],
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('asn_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="ASN #" />,
        cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('client_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('vendor_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
        cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('po_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="PO #" />,
        cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('expected_arrival_date', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expected" />,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {getValue() ? new Date(getValue() as string).toLocaleDateString() : '-'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ getValue }) => (
          <Badge variant="outline" className={statusBadgeClass(getValue())}>
            {ASN_STATUS_LABELS[getValue()] || getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('tracking_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tracking" />,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{getValue() || '-'}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const asn = row.original
          const isDraft = asn.status === 'CREATED' || asn.status === 'DRAFT'
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => setDetailAsnId(String(asn.asn_id))}>
                <EyeIcon className="size-3.5" /><span className="sr-only">View</span>
              </Button>
              {isDraft && (
                <>
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditAsn(asn)}>
                    <EditIcon className="size-3.5" /><span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteAsn(asn)}>
                    <Trash2Icon className="size-3.5 text-destructive" /><span className="sr-only">Delete</span>
                  </Button>
                </>
              )}
            </div>
          )
        },
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: asns,
    columns,
    pageCount: Math.ceil(total / search.limit),
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  const handleRefetch = useCallback(() => { refetch() }, [refetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advance Shipping Notices</h1>
          <p className="text-muted-foreground text-sm">
            Manage expected inbound shipments
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Create ASN
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">All ASNs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ASN #, PO #, vendor..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 h-9"
                />
                {search.q && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {ASN_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DataTableToolbar>
          {isLoading ? (
            <DataTableLoading columns={columns.length} />
          ) : (
            <DataTable
              table={table}
              isLoading={isLoading}
              error={isError ? (error as Error) : null}
              onRetry={handleRefetch}
            />
          )}
          <DataTablePagination table={table} total={total} />
        </CardContent>
      </Card>
      <CreateAsnWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleRefetch}
      />
      {editAsn && (
        <EditAsnDialog
          open={!!editAsn}
          onOpenChange={(open) => { if (!open) setEditAsn(null) }}
          asn={editAsn}
          onSuccess={handleRefetch}
        />
      )}
      <AsnDetailDrawer
        open={!!detailAsnId}
        onOpenChange={(open) => { if (!open) setDetailAsnId(null) }}
        asnId={detailAsnId}
      />
      {deleteAsn && (
        <ConfirmDialog
          open
          onOpenChange={(open) => { if (!open) setDeleteAsn(null) }}
          title="Delete ASN"
          description={`Are you sure you want to delete ASN #${deleteAsn.asn_number}? This action cannot be undone.`}
          confirmLabel="Delete"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
