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
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { DataTable, DataTableLoading } from '@/components/data-table/data-table'
import { ConfirmDialog } from '@/components/common/dialogs/confirm-dialog'
import { DetailDialog, type DetailField } from '@/components/common/dialogs/detail-dialog'
import { useVendorsList, useDeleteVendor } from '@/features/vendors/data/vendor-queries'
import { CreateVendorDialog } from '@/features/vendors/components/create-vendor-dialog'
import { EditVendorDialog } from '@/features/vendors/components/edit-vendor-dialog'
import type { VendorResponseDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/master-data/vendors')({
  component: VendorsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<VendorResponseDto>()

function VendorsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [searchInput, setSearchInput] = useState(search.q)

  const [createOpen, setCreateOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<VendorResponseDto | null>(null)
  const [viewVendor, setViewVendor] = useState<VendorResponseDto | null>(null)
  const [deleteVendor, setDeleteVendor] = useState<VendorResponseDto | null>(null)

  const { data, isLoading, isError, error, refetch } = useVendorsList({
    page: search.page,
    limit: search.limit,
    search: search.q,
  })

  const deleteMutation = useDeleteVendor()

  const vendors = data?.data ?? []
  const total = data?.total ?? 0

  const handleDelete = useCallback(() => {
    if (!deleteVendor) return
    deleteMutation.mutate(deleteVendor.vendor_id, {
      onSuccess: () => setDeleteVendor(null),
    })
  }, [deleteVendor, deleteMutation])

  const navigateWithParams = useCallback(
    (params: Partial<{ page: number; limit: number; q: string }>) => {
      navigate({
        to: '/master-data/vendors',
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

  const pagination = useMemo(
    () => ({
      pageIndex: search.page - 1,
      pageSize: search.limit,
    }),
    [search.page, search.limit],
  )

  const onPaginationChange = useCallback(
    (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater
      navigateWithParams({
        page: newPagination.pageIndex + 1,
        limit: newPagination.pageSize,
      })
    },
    [navigateWithParams, pagination],
  )

  const viewFields = useMemo((): DetailField[] => {
    if (!viewVendor) return []
    return [
      { label: 'Code', value: viewVendor.vendor_code },
      { label: 'Name', value: viewVendor.vendor_name },
      { label: 'Description', value: viewVendor.description },
      { label: 'Status', value: viewVendor.is_active },
    ]
  }, [viewVendor])

  const columns = useMemo(
    () => [
      columnHelper.accessor('vendor_code', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium">{getValue()}</span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('vendor_name', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{getValue() || '-'}</span>
        ),
      }),
      columnHelper.accessor('is_active', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ getValue }) => (
          <Badge
            className={
              getValue()
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : ''
            }
            variant={getValue() ? 'outline' : 'secondary'}
          >
            {getValue() ? 'Active' : 'Inactive'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setViewVendor(row.original)}
            >
              <EyeIcon className="size-3.5" />
              <span className="sr-only">View</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditVendor(row.original)}
            >
              <EditIcon className="size-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteVendor(row.original)}
            >
              <Trash2Icon className="size-3.5 text-destructive" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: vendors,
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
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground text-sm">Manage vendors</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Add Vendor
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">All Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or name..."
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
      <CreateVendorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleRefetch}
      />
      {editVendor && (
        <EditVendorDialog
          open
          onOpenChange={(open) => { if (!open) setEditVendor(null) }}
          vendor={editVendor}
          onSuccess={handleRefetch}
        />
      )}
      {viewVendor && (
        <DetailDialog
          open
          onOpenChange={(open) => { if (!open) setViewVendor(null) }}
          title={viewVendor.vendor_name}
          subtitle={`Code: ${viewVendor.vendor_code}`}
          fields={viewFields}
        />
      )}
      {deleteVendor && (
        <ConfirmDialog
          open
          onOpenChange={(open) => { if (!open) setDeleteVendor(null) }}
          title="Delete Vendor"
          description={`Are you sure you want to delete "${deleteVendor.vendor_name}"?`}
          confirmLabel="Delete"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
