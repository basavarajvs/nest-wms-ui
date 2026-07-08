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
import {
  useFacilitiesList,
  useDeleteFacility,
} from '@/features/facilities/data/facility-queries'
import { FACILITY_TYPE_LABELS } from '@/features/facilities/constants/facility-type-options'
import { TIMEZONE_LABELS, type Timezone } from '@/lib/constants/timezones'
import { COUNTRY_LABELS, type Country } from '@/lib/constants/countries'
import type { Facility } from '@/features/facilities/data/facility-queries'
import { CreateFacilityDialog } from '@/features/facilities/components/create-facility-dialog'
import { EditFacilityDialog } from '@/features/facilities/components/edit-facility-dialog'

export const Route = createFileRoute('/_authenticated/warehouse/facilities')({
  component: FacilitiesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<Facility>()

function FacilitiesPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [searchInput, setSearchInput] = useState(search.q)

  const [createOpen, setCreateOpen] = useState(false)
  const [editFacility, setEditFacility] = useState<Facility | null>(null)
  const [viewFacility, setViewFacility] = useState<Facility | null>(null)
  const [deleteFacility, setDeleteFacility] = useState<Facility | null>(null)

  const { data, isLoading, isError, error, refetch } = useFacilitiesList({
    page: search.page,
    limit: search.limit,
    search: search.q,
  })

  const deleteMutation = useDeleteFacility()

  const facilities = data?.data ?? []
  const total = data?.total ?? 0

  const handleDelete = useCallback(() => {
    if (!deleteFacility) return
    deleteMutation.mutate(deleteFacility.facility_id, {
      onSuccess: () => setDeleteFacility(null),
    })
  }, [deleteFacility, deleteMutation])

  const navigateWithParams = useCallback(
    (params: Partial<{ page: number; limit: number; q: string }>) => {
      navigate({
        to: '/warehouse/facilities',
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
    () => ({ pageIndex: search.page - 1, pageSize: search.limit }),
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
    if (!viewFacility) return []
    return [
      { label: 'Code', value: viewFacility.facility_code },
      { label: 'Name', value: viewFacility.facility_name },
      { label: 'Type', value: FACILITY_TYPE_LABELS[viewFacility.facility_type] || viewFacility.facility_type },
      { label: 'Country', value: COUNTRY_LABELS[viewFacility.country_code as Country] || viewFacility.country_code || '-' },
      { label: 'Timezone', render: () => TIMEZONE_LABELS[viewFacility.timezone_name as Timezone] || viewFacility.timezone_name || '-' },
      { label: 'Status', value: viewFacility.is_active },
      { label: 'Description', value: viewFacility.description },
      {
        label: 'Address',
        render: () => {
          const parts = [
            viewFacility.address_line1,
            viewFacility.address_line2,
            viewFacility.city,
            viewFacility.state_province,
            viewFacility.postal_code,
            viewFacility.country_code,
          ].filter(Boolean)
          return (
            <div className="col-span-2">
              <span className="text-muted-foreground">Address</span>
              <p className="mt-1 font-medium text-sm">
                {parts.length > 0 ? parts.join(', ') : '-'}
              </p>
            </div>
          )
        },
      },
      {
        label: 'Contact',
        render: () => {
          const parts = [
            viewFacility.contact_person,
            viewFacility.contact_phone,
            viewFacility.contact_email,
          ].filter(Boolean)
          return (
            <div className="col-span-2">
              <span className="text-muted-foreground">Contact</span>
              <p className="mt-1 font-medium text-sm">
                {parts.length > 0 ? parts.join(' | ') : '-'}
              </p>
            </div>
          )
        },
      },
    ]
  }, [viewFacility])

  const columns = useMemo(
    () => [
      columnHelper.accessor('facility_code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ getValue }) => <span className="font-mono text-xs font-medium">{getValue()}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('facility_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
      }),
      columnHelper.accessor('facility_type', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ getValue }) => {
          const raw = getValue()
          const label = raw ? FACILITY_TYPE_LABELS[raw as keyof typeof FACILITY_TYPE_LABELS] || raw : '-'
          return <span className="text-muted-foreground text-sm">{label}</span>
        },
      }),
      columnHelper.accessor('city', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="City" />,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">{getValue() || '-'}</span>
        ),
      }),
      columnHelper.accessor('country_code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
        cell: ({ getValue }) => {
          const code = getValue()
          const label = code ? COUNTRY_LABELS[code as Country] || code : '-'
          return <span className="text-muted-foreground text-sm">{label}</span>
        },
      }),
      columnHelper.accessor('is_active', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
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
            <Button variant="ghost" size="icon-sm" onClick={() => setViewFacility(row.original)}>
              <EyeIcon className="size-3.5" /><span className="sr-only">View</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditFacility(row.original)}>
              <EditIcon className="size-3.5" /><span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteFacility(row.original)}>
              <Trash2Icon className="size-3.5 text-destructive" /><span className="sr-only">Delete</span>
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: facilities,
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
          <h1 className="text-2xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground text-sm">
            Manage warehouse facilities
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Add Facility
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">All Facilities</CardTitle>
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
      <CreateFacilityDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleRefetch}
      />
      {editFacility && (
        <EditFacilityDialog
          open
          onOpenChange={(open) => { if (!open) setEditFacility(null) }}
          facility={editFacility}
          onSuccess={handleRefetch}
        />
      )}
      {viewFacility && (
        <DetailDialog
          open
          onOpenChange={(open) => { if (!open) setViewFacility(null) }}
          title={viewFacility.facility_name}
          subtitle={`Code: ${viewFacility.facility_code}`}
          fields={viewFields}
        />
      )}
      {deleteFacility && (
        <ConfirmDialog
          open
          onOpenChange={(open) => { if (!open) setDeleteFacility(null) }}
          title="Delete Facility"
          description={`Are you sure you want to delete "${deleteFacility.facility_name}"?`}
          confirmLabel="Delete"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
