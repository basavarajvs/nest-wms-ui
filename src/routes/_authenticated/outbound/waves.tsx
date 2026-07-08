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
import { EyeIcon, EditIcon, PlusIcon, SearchIcon, XIcon, PlayIcon } from 'lucide-react'
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
  useWavesList,
  useReleaseWave,
  WAVE_STATUS_OPTIONS,
  WAVE_STATUS_LABELS,
  WAVE_TYPE_LABELS,
} from '@/features/outbound/data/wave-queries'
import { WaveDetailDrawer } from '@/features/outbound/components/wave-detail-drawer'
import { CreateWaveWizard } from '@/features/outbound/components/create-wave-wizard'
import type { PickingWaveDto } from '@/lib/wms-api/types/wms-api'

export const Route = createFileRoute('/_authenticated/outbound/waves')({
  component: WavesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    limit: Number(search.limit) || 20,
    q: (search.q as string) ?? '',
    status: (search.status as string) ?? '',
  }),
})

const columnHelper = createColumnHelper<PickingWaveDto>()

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'CREATED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'RELEASED':
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

function WavesPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: Route.id })
  const { page, limit, q, status } = search

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useWavesList({
    page,
    limit,
    search: q || undefined,
    status: status || undefined,
  })

  const releaseMutation = useReleaseWave()

  const columns = useMemo(
    () => [
      columnHelper.accessor('wave_number', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Wave #" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue('wave_number')}</span>,
      }),
      columnHelper.accessor('wave_name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ getValue }) => <span>{getValue() || '-'}</span>,
      }),
      columnHelper.accessor('wave_type', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ getValue }) => {
          const val = getValue() as string | undefined
          return <span className="text-sm">{val ? WAVE_TYPE_LABELS[val] ?? val : '-'}</span>
        },
      }),
      columnHelper.accessor('order_count', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Orders" />,
        cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue() ?? '-'}</span>,
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const val = row.getValue('status') as string | undefined
          return <Badge className={statusBadgeClass(val)}>{WAVE_STATUS_LABELS[val ?? ''] ?? val ?? '-'}</Badge>
        },
      }),
      columnHelper.accessor('total_tasks', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tasks" />,
        cell: ({ row }) => {
          const total = row.original.total_tasks
          const completed = row.original.completed_tasks
          return <span className="tabular-nums text-sm">{total != null ? `${completed ?? 0}/${total}` : '-'}</span>
        },
      }),
      columnHelper.accessor('created_date', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ getValue }) => {
          const val = getValue()
          return <span className="text-sm text-muted-foreground">{val ? new Date(val as string).toLocaleDateString() : '-'}</span>
        },
      }),
      columnHelper.accessor('released_at', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Released" />,
        cell: ({ getValue }) => {
          const val = getValue()
          return <span className="text-sm text-muted-foreground">{val ? new Date(val as string).toLocaleDateString() : '-'}</span>
        },
      }),
      columnHelper.accessor('completed_at', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Completed" />,
        cell: ({ getValue }) => {
          const val = getValue()
          return <span className="text-sm text-muted-foreground">{val ? new Date(val as string).toLocaleDateString() : '-'}</span>
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const wave = row.original
          const id = wave.wave_id
          const isCreated = wave.status === 'CREATED'
          return (
            <div className="flex gap-1">
              {isCreated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    releaseMutation.mutate(id)
                  }}
                  disabled={releaseMutation.isPending}
                  title="Release"
                >
                  <PlayIcon className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedWaveId(id)
                  setDrawerOpen(true)
                }}
                title="View"
              >
                <EyeIcon className="size-3.5" />
              </Button>
            </div>
          )
        },
      }),
    ],
    [releaseMutation],
  )

  const waves = data?.data ?? []
  const total = data?.total ?? 0

  const table = useReactTable({
    data: waves,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Picking Waves</h1>
          <p className="text-sm text-muted-foreground">
            Create, release, and monitor picking waves for efficient order fulfillment.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Create Wave
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Waves</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableToolbar table={table}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wave #, name..."
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
                  {WAVE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {WAVE_STATUS_LABELS[opt]}
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
              <p className="text-sm font-medium">Failed to load waves</p>
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

      <CreateWaveWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={() => refetch()}
      />

      <WaveDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        waveId={selectedWaveId}
      />
    </div>
  )
}
