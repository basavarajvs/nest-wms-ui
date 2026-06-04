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
import { RefreshCw, Layers, MoreHorizontal, Eye, UserPlus, Play, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  usePutawayBoard,
  useUpdatePutawayTaskStatus,
  type PutawayTask,
} from '@/features/inbound/putaway-board/data/putaway-queries'
import { PutawayTaskDetailDialog } from '@/features/inbound/putaway-board/components/PutawayTaskDetailDialog'
import { AssignUserDialog } from '@/features/inbound/putaway-board/components/AssignUserDialog'

const STATUS_FILTER_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
]

const PRIORITY_FILTER_OPTIONS = [
  { label: '1 (Low)', value: '1' },
  { label: '2', value: '2' },
  { label: '3 (Medium)', value: '3' },
  { label: '5 (High)', value: '5' },
]

const PRIORITY_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  '1': 'secondary',
  '2': 'outline',
  '3': 'default',
  '5': 'destructive',
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  on_hold: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
}

const STATS_CARD_STYLES: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  pending: { label: 'Pending', bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', icon: 'bg-yellow-100 dark:bg-yellow-900/50' },
  in_progress: { label: 'In Progress', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', icon: 'bg-purple-100 dark:bg-purple-900/50' },
  completed: { label: 'Completed', bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', icon: 'bg-green-100 dark:bg-green-900/50' },
  total: { label: 'Total', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', icon: 'bg-blue-100 dark:bg-blue-900/50' },
}

export function PutawayTaskList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [detailDialogTask, setDetailDialogTask] = useState<PutawayTask | null>(null)
  const [assignDialogTask, setAssignDialogTask] = useState<PutawayTask | null>(null)

  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })

  const { data, isLoading, isError, error, refetch, isFetching } =
    usePutawayBoard({
      page: 1,
      limit: 100,
    })

  const updateStatus = useUpdatePutawayTaskStatus()

  const tasks: PutawayTask[] = data?.items || []

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'assigned').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const completed = tasks.filter((t) => t.status === 'completed').length
    return { pending, inProgress, completed, total: tasks.length }
  }, [tasks])

  const assignedUserFilterOptions = useMemo(() => {
    const names = new Set<string>()
    tasks.forEach((t) => {
      const name = t.assignedToUserName ?? t.assignedToUserId
      if (name) names.add(name)
    })
    return Array.from(names).map((name) => ({
      label: name,
      value: name,
    }))
  }, [tasks])

  const handleStatusAction = async (task: PutawayTask, newStatus: string) => {
    if (!task.id) return
    try {
      await updateStatus.mutateAsync({ id: task.id, status: newStatus })
      toast.success(`Task ${newStatus.replace(/_/g, ' ')}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Status update failed')
    }
  }

  const columns: ColumnDef<PutawayTask, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Task ID' />
        ),
        cell: ({ row }) => (
          <span className='block max-w-[100px] truncate font-mono text-xs'>
            {row.original.id?.substring(0, 12) + '...' || '—'}
          </span>
        ),
      },
      {
        id: 'product',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Product' />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.original.productName ?? row.original.productId ?? '—'}
            </span>
            {row.original.productSku && (
              <span className="text-xs text-muted-foreground">{row.original.productSku}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Expected Qty' />
        ),
        cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('quantity') ?? '—'}</span>,
      },
      {
        id: 'sourceLocation',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Source Location' />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.sourceLocationName ?? row.original.sourceLocationId ?? 'Receiving Dock'}
          </span>
        ),
      },
      {
        accessorKey: 'suggestedLocationId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Destination' />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="max-w-[100px] truncate font-mono text-xs">
              {row.original.suggestedLocationName ?? row.original.suggestedLocationId ?? '—'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
          const status = (row.getValue('status') as string) || ''
          return (
            <Badge
              variant='outline'
              className={`${STATUS_BADGE_COLORS[status] || ''} capitalize`}
            >
              {(status || '—').replace(/_/g, ' ')}
            </Badge>
          )
        },
        filterFn: 'arrIncludesSome',
      },
      {
        id: 'assignedTo',
        accessorFn: (row) => row.assignedToUserName ?? row.assignedToUserId ?? 'Unassigned',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Assigned User' />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.assignedToUserName ?? row.original.assignedToUserId ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Priority' />
        ),
        cell: ({ row }) => {
          const priority = row.getValue('priority') as number | null | undefined
          return priority != null && priority > 0 ? (
            <Badge
              variant={PRIORITY_BADGE_VARIANTS[String(priority)] || 'outline'}
            >
              {priority}
            </Badge>
          ) : (
            <span className='text-muted-foreground'>—</span>
          )
        },
        filterFn: 'arrIncludesSome',
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const task = row.original
          const status = task.status?.toLowerCase() ?? ''

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailDialogTask(task)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {(status === 'pending' || status === 'assigned') && (
                  <DropdownMenuItem onClick={() => setAssignDialogTask(task)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign To
                  </DropdownMenuItem>
                )}
                {status === 'pending' && (
                  <DropdownMenuItem onClick={() => handleStatusAction(task, 'in_progress')}>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </DropdownMenuItem>
                )}
                {status === 'in_progress' && (
                  <DropdownMenuItem onClick={() => handleStatusAction(task, 'completed')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete
                  </DropdownMenuItem>
                )}
                {(status === 'pending' || status === 'assigned') && (
                  <DropdownMenuItem onClick={() => handleStatusAction(task, 'cancelled')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [updateStatus]
  )

  const table = useReactTable({
    data: tasks,
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
    <>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Putaway Board</h1>
            <p className='text-muted-foreground'>
              Real-time view of inbound putaway tasks
            </p>
          </div>
          <Button
            onClick={() => {
              refetch()
              toast.info('Refreshing putaway board...')
            }}
            disabled={isFetching}
            variant='outline'
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />{' '}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {(['pending', 'in_progress', 'completed', 'total'] as const).map((key) => {
            const config = STATS_CARD_STYLES[key]
            const count = key === 'total' ? stats.total
              : key === 'in_progress' ? stats.inProgress
              : key === 'pending' ? stats.pending
              : stats.completed
            return (
              <Card key={key} className={cn(config.bg, 'border-0')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn('text-2xl font-bold', config.text)}>
                        {count}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {config.label}
                      </p>
                    </div>
                    <div className={cn('rounded-lg p-2', config.icon)}>
                      {key === 'pending' && <Layers className={cn('h-5 w-5', config.text)} />}
                      {key === 'in_progress' && <Play className={cn('h-5 w-5', config.text)} />}
                      {key === 'completed' && <CheckCircle2 className={cn('h-5 w-5', config.text)} />}
                      {key === 'total' && <ArrowRight className={cn('h-5 w-5', config.text)} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <DataTableToolbar
          table={table}
          searchPlaceholder='Filter by product...'
          filters={[
            {
              columnId: 'status',
              title: 'Status',
              options: STATUS_FILTER_OPTIONS,
            },
            {
              columnId: 'priority',
              title: 'Priority',
              options: PRIORITY_FILTER_OPTIONS,
            },
            ...(assignedUserFilterOptions.length > 0
              ? [{
                  columnId: 'assignedTo',
                  title: 'Assigned User',
                  options: assignedUserFilterOptions,
                }]
              : []
            ),
          ]}
        />

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle>Putaway Tasks ({tasks.length})</CardTitle>
            <CardDescription>Tasks detail table</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {isLoading ? (
              <div className='space-y-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className='h-16 w-full' />
                ))}
              </div>
            ) : isError ? (
              <div className='flex flex-col items-center gap-2 py-8 text-center'>
                <p className='font-medium text-destructive'>
                  Failed to load putaway board
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
                <Layers className='h-12 w-12 text-muted-foreground/30' />
                <p className='text-muted-foreground'>No putaway tasks found</p>
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
      </div>

      {detailDialogTask && (
        <PutawayTaskDetailDialog
          task={detailDialogTask}
          open={!!detailDialogTask}
          onOpenChange={(open) => { if (!open) setDetailDialogTask(null) }}
        />
      )}

      {assignDialogTask && assignDialogTask.id && (
        <AssignUserDialog
          taskId={assignDialogTask.id}
          open={!!assignDialogTask}
          onOpenChange={(open) => { if (!open) setAssignDialogTask(null) }}
        />
      )}
    </>
  )
}
