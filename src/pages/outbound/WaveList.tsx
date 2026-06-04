import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import type { WaveStatus } from '@/types/warehouse-statuses'
import { RefreshCw, MoreHorizontal, Eye, Package, Play, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { WaveStatusBadge } from '@/components/status-badges'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useWaveBoard,
  type WaveTask,
} from '@/features/outbound/waves/data/wave-queries'
import { WaveCreateDialog } from '@/features/outbound/waves/components/WaveCreateDialog'
import { WaveDetailDialog } from '@/features/outbound/waves/components/WaveDetailDialog'
import { GeneratePickTasksDialog } from '@/features/outbound/waves/components/GeneratePickTasksDialog'

const STATUS_FILTER_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
]

export function WaveList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<WaveTask | null>(null)
  const [generateTask, setGenerateTask] = useState<WaveTask | null>(null)

  const {
    data: waves,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useWaveBoard({})
  const { selectedFacility } = useFacility()

  const waveTasks: WaveTask[] = waves || []

  const isReleased = (status?: string) =>
    status?.toLowerCase() === 'released' || status?.toLowerCase() === 'in_progress'

  const columns: ColumnDef<WaveTask, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Task ID' />
        ),
        cell: ({ row }) => (
          <span className='max-w-[100px] truncate font-mono text-xs'>
            {row.original.id ? row.original.id.substring(0, 12) + '...' : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'orderId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Order' />
        ),
        cell: ({ row }) => (
          <span className='max-w-[100px] truncate font-mono text-xs'>
            {row.getValue('orderId') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'productId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Product' />
        ),
        cell: ({ row }) => (
          <span className='max-w-[100px] truncate font-mono text-xs'>
            {row.getValue('productId') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Qty' />
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <WaveStatusBadge
            status={
              ((row.getValue('status') as string) || '')
                .toUpperCase()
                .replace('IN_PROGRESS', 'IN_PROGRESS') as WaveStatus
            }
          />
        ),
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'assignedToUserId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Assigned' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.original.assignedToUserId
              ? row.original.assignedToUserId.substring(0, 12) + '...'
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const task = row.original
          const canGenerate = isReleased(task.status)
          const isCompleted = task.status?.toLowerCase() === 'completed'
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setDetailTask(task)}>
                  <Eye className='mr-2 h-4 w-4' />
                  View Details
                </DropdownMenuItem>
                {canGenerate && (
                  <DropdownMenuItem onClick={() => setGenerateTask(task)}>
                    <Package className='mr-2 h-4 w-4' />
                    Generate Pick Tasks
                  </DropdownMenuItem>
                )}
                {!isCompleted && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toast.info('Wave release endpoint not yet available.')}
                    >
                      <Play className='mr-2 h-4 w-4' />
                      Release
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toast.info('Wave complete endpoint not yet available.')}
                    >
                      <CheckCircle2 className='mr-2 h-4 w-4' />
                      Mark Completed
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: waveTasks,
    columns,
    state: {
      sorting,
      globalFilter: tableUrlState.globalFilter ?? '',
      columnFilters: tableUrlState.columnFilters,
      pagination: tableUrlState.pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onColumnFiltersChange: tableUrlState.onColumnFiltersChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Picking Waves</h1>
          <p className='text-muted-foreground'>
            Wave planning and picking board
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />{' '}
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Package className='mr-2 h-4 w-4' /> New Wave
          </Button>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by product or order...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Wave Board ({waveTasks.length} tasks)</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-32' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load wave board
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <p className='text-muted-foreground'>No wave tasks found</p>
              <p className='max-w-md text-sm text-muted-foreground'>
                {tableUrlState.globalFilter || tableUrlState.columnFilters.length > 0
                  ? 'No tasks match the current filters.'
                  : 'Create a wave to get started.'}
              </p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <WaveCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {detailTask && (
        <WaveDetailDialog
          task={detailTask}
          open={!!detailTask}
          onOpenChange={(open) => { if (!open) setDetailTask(null) }}
        />
      )}

      {generateTask && (
        <GeneratePickTasksDialog
          taskId={generateTask.id!}
          taskLabel={generateTask.id?.substring(0, 12)}
          open={!!generateTask}
          onOpenChange={(open) => { if (!open) setGenerateTask(null) }}
        />
      )}
    </div>
  )
}
