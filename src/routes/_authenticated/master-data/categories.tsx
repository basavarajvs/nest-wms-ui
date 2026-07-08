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
import { useCategories, useDeleteCategory } from '@/features/categories/data/category-queries'
import { CreateCategoryDialog } from '@/features/categories/components/create-category-dialog'
import { EditCategoryDialog } from '@/features/categories/components/edit-category-dialog'
import type { CategoryResponseDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/master-data/categories')({
  component: CategoriesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<CategoryResponseDto>()

function CategoriesPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState<string>(search.q)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const [createOpen, setCreateOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<CategoryResponseDto | null>(null)
  const [viewCategory, setViewCategory] = useState<CategoryResponseDto | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<CategoryResponseDto | null>(null)

  const { data: categories, isLoading, isError, error, refetch } = useCategories()
  const deleteMutation = useDeleteCategory()

  const handleDelete = useCallback(() => {
    if (!deleteCategory) return
    deleteMutation.mutate(deleteCategory.category_id, {
      onSuccess: () => setDeleteCategory(null),
    })
  }, [deleteCategory, deleteMutation])

  const handleSearch = useCallback(
    (value: string) => {
      setGlobalFilter(value)
      navigate({ to: '/master-data/categories', search: { q: value } })
    },
    [navigate],
  )

  const clearSearch = useCallback(() => {
    setGlobalFilter('')
    navigate({ to: '/master-data/categories', search: { q: '' } })
  }, [navigate])

  const viewFields = useMemo((): DetailField[] => {
    if (!viewCategory) return []
    return [
      { label: 'Code', value: viewCategory.category_code },
      { label: 'Name', value: viewCategory.category_name },
      { label: 'Description', value: viewCategory.description },
      { label: 'Status', value: viewCategory.is_active },
    ]
  }, [viewCategory])

  const columns = useMemo(
    () => [
      columnHelper.accessor('category_code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('category_name', {
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
            <Button variant="ghost" size="icon-sm" onClick={() => setViewCategory(row.original)}>
              <EyeIcon className="size-3.5" /><span className="sr-only">View</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditCategory(row.original)}>
              <EditIcon className="size-3.5" /><span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteCategory(row.original)}>
              <Trash2Icon className="size-3.5 text-destructive" /><span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: categories ?? [],
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
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">Manage product categories</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />Add Category
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">All Categories</CardTitle>
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
      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={handleRefetch} />
      {editCategory && <EditCategoryDialog open onOpenChange={(open) => { if (!open) setEditCategory(null) }} category={editCategory} onSuccess={handleRefetch} />}
      {viewCategory && <DetailDialog open onOpenChange={(open) => { if (!open) setViewCategory(null) }} title={viewCategory.category_name} subtitle={`Code: ${viewCategory.category_code}`} fields={viewFields} />}
      {deleteCategory && (
        <ConfirmDialog open onOpenChange={(open) => { if (!open) setDeleteCategory(null) }} title="Delete Category" description={`Are you sure you want to delete "${deleteCategory.category_name}"?`} confirmLabel="Delete" destructive isLoading={deleteMutation.isPending} onConfirm={handleDelete} />
      )}
    </div>
  )
}
