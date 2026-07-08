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
  getFilteredRowModel,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
  type PaginationState,
  type GlobalFilterTableState,
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
import { useBrandsList, useDeleteBrand } from '@/features/brands/data/brand-queries'
import { CreateBrandDialog } from '@/features/brands/components/create-brand-dialog'
import { EditBrandDialog } from '@/features/brands/components/edit-brand-dialog'
import type { BrandResponseDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/master-data/brands')({
  component: BrandsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<BrandResponseDto>()

function BrandsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState<string>(search.q)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const [createOpen, setCreateOpen] = useState(false)
  const [editBrand, setEditBrand] = useState<BrandResponseDto | null>(null)
  const [viewBrand, setViewBrand] = useState<BrandResponseDto | null>(null)
  const [deleteBrand, setDeleteBrand] = useState<BrandResponseDto | null>(null)

  const { data: brands, isLoading, isError, error, refetch } = useBrandsList()
  const deleteMutation = useDeleteBrand()

  const handleDelete = useCallback(() => {
    if (!deleteBrand) return
    deleteMutation.mutate(deleteBrand.brand_id, {
      onSuccess: () => setDeleteBrand(null),
    })
  }, [deleteBrand, deleteMutation])

  const handleSearch = useCallback(
    (value: string) => {
      setGlobalFilter(value)
      navigate({ to: '/master-data/brands', search: { q: value } })
    },
    [navigate],
  )

  const clearSearch = useCallback(() => {
    setGlobalFilter('')
    navigate({ to: '/master-data/brands', search: { q: '' } })
  }, [navigate])

  const viewFields = useMemo((): DetailField[] => {
    if (!viewBrand) return []
    return [
      { label: 'Code', value: viewBrand.brand_code },
      { label: 'Name', value: viewBrand.brand_name },
      { label: 'Description', value: viewBrand.description },
      { label: 'Status', value: viewBrand.is_active },
    ]
  }, [viewBrand])

  const columns = useMemo(
    () => [
      columnHelper.accessor('brand_code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('brand_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      }),
      columnHelper.accessor('description', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
        cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('is_active', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ getValue }) => (
          <Badge className={getValue() ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''} variant={getValue() ? 'outline' : 'secondary'}>
            {getValue() ? 'Active' : 'Inactive'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setViewBrand(row.original)}>
              <EyeIcon className="size-3.5" /><span className="sr-only">View</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditBrand(row.original)}>
              <EditIcon className="size-3.5" /><span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteBrand(row.original)}>
              <Trash2Icon className="size-3.5 text-destructive" /><span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: brands ?? [],
    columns,
    state: { sorting, columnVisibility, pagination, globalFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleRefetch = useCallback(() => { refetch() }, [refetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground text-sm">Manage product brands</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />Add Brand
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">All Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="relative w-full max-w-sm">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search by code or name..." value={globalFilter} onChange={(e) => handleSearch(e.target.value)} className="pl-8 h-9" />
              {globalFilter && <button onClick={clearSearch} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"><XIcon className="size-4" /></button>}
            </div>
          </DataTableToolbar>
          {isLoading ? <DataTableLoading columns={columns.length} /> : (
            <DataTable table={table} isLoading={isLoading} error={isError ? (error as Error) : null} onRetry={handleRefetch} />
          )}
          <DataTablePagination table={table} total={table.getFilteredRowModel().rows.length} />
        </CardContent>
      </Card>
      <CreateBrandDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={handleRefetch} />
      {editBrand && <EditBrandDialog open onOpenChange={(open) => { if (!open) setEditBrand(null) }} brand={editBrand} onSuccess={handleRefetch} />}
      {viewBrand && <DetailDialog open onOpenChange={(open) => { if (!open) setViewBrand(null) }} title={viewBrand.brand_name} subtitle={`Code: ${viewBrand.brand_code}`} fields={viewFields} />}
      {deleteBrand && (
        <ConfirmDialog open onOpenChange={(open) => { if (!open) setDeleteBrand(null) }} title="Delete Brand" description={`Are you sure you want to delete "${deleteBrand.brand_name}"?`} confirmLabel="Delete" destructive isLoading={deleteMutation.isPending} onConfirm={handleDelete} />
      )}
    </div>
  )
}
