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
import { useUomsList, useDeleteUom } from '@/features/uoms/data/uom-queries'
import { CreateUomDialog } from '@/features/uoms/components/create-uom-dialog'
import { EditUomDialog } from '@/features/uoms/components/edit-uom-dialog'
import type { UomResponseDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/master-data/uoms')({
  component: UomsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<UomResponseDto>()

function UomsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState<string>(search.q)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const [createOpen, setCreateOpen] = useState(false)
  const [editUom, setEditUom] = useState<UomResponseDto | null>(null)
  const [viewUom, setViewUom] = useState<UomResponseDto | null>(null)
  const [deleteUom, setDeleteUom] = useState<UomResponseDto | null>(null)

  const { data: uoms, isLoading, isError, error, refetch } = useUomsList()
  const deleteMutation = useDeleteUom()

  const handleDelete = useCallback(() => {
    if (!deleteUom) return
    deleteMutation.mutate(deleteUom.uom_id, {
      onSuccess: () => setDeleteUom(null),
    })
  }, [deleteUom, deleteMutation])

  const handleSearch = useCallback(
    (value: string) => {
      setGlobalFilter(value)
      navigate({ to: '/master-data/uoms', search: { q: value } })
    },
    [navigate],
  )

  const clearSearch = useCallback(() => {
    setGlobalFilter('')
    navigate({ to: '/master-data/uoms', search: { q: '' } })
  }, [navigate])

  const viewFields = useMemo((): DetailField[] => {
    if (!viewUom) return []
    return [
      { label: 'Code', value: viewUom.uom_code },
      { label: 'Name', value: viewUom.uom_name },
      { label: 'Description', value: viewUom.description },
      { label: 'Status', value: viewUom.is_active },
    ]
  }, [viewUom])

  const columns = useMemo(
    () => [
      columnHelper.accessor('uom_code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('uom_name', {
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
            <Button variant="ghost" size="icon-sm" onClick={() => setViewUom(row.original)}>
              <EyeIcon className="size-3.5" /><span className="sr-only">View</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditUom(row.original)}>
              <EditIcon className="size-3.5" /><span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteUom(row.original)}>
              <Trash2Icon className="size-3.5 text-destructive" /><span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: uoms ?? [],
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
          <h1 className="text-2xl font-bold tracking-tight">Units of Measure</h1>
          <p className="text-muted-foreground text-sm">Manage units of measure</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />Add UOM
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">All Units of Measure</CardTitle>
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
      <CreateUomDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={handleRefetch} />
      {editUom && <EditUomDialog open onOpenChange={(open) => { if (!open) setEditUom(null) }} uom={editUom} onSuccess={handleRefetch} />}
      {viewUom && <DetailDialog open onOpenChange={(open) => { if (!open) setViewUom(null) }} title={viewUom.uom_name} subtitle={`Code: ${viewUom.uom_code}`} fields={viewFields} />}
      {deleteUom && (
        <ConfirmDialog open onOpenChange={(open) => { if (!open) setDeleteUom(null) }} title="Delete UOM" description={`Are you sure you want to delete "${deleteUom.uom_name}"?`} confirmLabel="Delete" destructive isLoading={deleteMutation.isPending} onConfirm={handleDelete} />
      )}
    </div>
  )
}
