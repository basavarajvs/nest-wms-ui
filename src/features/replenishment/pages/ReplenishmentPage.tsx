import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw, ShoppingCart, ClipboardList, History, Loader2, CheckCircle, XCircle } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import {
  useReplenishmentSuggestions,
  useReplenishmentTasks,
  useCreateReplenishmentTask,
  useCompleteReplenishmentTask,
  useCancelReplenishmentTask,
  type ReplenishmentSuggestion,
  type ReplenishmentTask,
} from '@/features/replenishment/data/replenishment-queries'

import { useFacility } from '@/hooks/useFacility'

const TASK_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant='outline'>—</Badge>
  const cls = TASK_STATUS_BADGE[status] || ''
  return (
    <Badge variant='outline' className={`${cls} capitalize`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null
  const cls = PRIORITY_BADGE[priority] || ''
  return (
    <Badge variant='outline' className={cls}>
      {priority}
    </Badge>
  )
}

export function ReplenishmentPage() {
  const { selectedFacility } = useFacility()
  const createTask = useCreateReplenishmentTask()
  const completeTask = useCompleteReplenishmentTask()
  const cancelTask = useCancelReplenishmentTask()

  const [activeTab, setActiveTab] = useState('suggestions')
  const [suggestionSorting, setSuggestionSorting] = useState<SortingState>([])
  const [activeSorting, setActiveSorting] = useState<SortingState>([])
  const [historySorting, setHistorySorting] = useState<SortingState>([])

  const facilityId = selectedFacility?.id || ''

  const { data: suggestionsData, isLoading: sugLoading, isError: sugError, refetch: sugRefetch, isFetching: sugFetching } =
    useReplenishmentSuggestions(facilityId)
  const suggestions: ReplenishmentSuggestion[] = suggestionsData?.suggestions || []

  const { data: tasksData, isLoading: tasksLoading, isError: tasksError, refetch: tasksRefetch, isFetching: tasksFetching } =
    useReplenishmentTasks(facilityId ? { facilityId } : undefined)
  const allTasks: ReplenishmentTask[] = tasksData?.tasks || []

  const activeTasks = allTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS')
  const historyTasks = allTasks.filter((t) => t.status === 'COMPLETED')

  const isBusy = sugLoading || tasksLoading || sugFetching || tasksFetching

  const handleCreateTask = async (suggestion: ReplenishmentSuggestion) => {
    if (!facilityId) {
      toast.error('Please select a facility first')
      return
    }
    try {
      await createTask.mutateAsync({
        facilityId,
        productId: suggestion.productId,
        fromLocationId: suggestion.bulkLocationId,
        toLocationId: suggestion.pickLocationId,
        requestedQuantity: suggestion.suggestedQty,
        priority: suggestion.priority as any,
      })
      toast.success('Replenishment task created')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create task')
    }
  }

  const handleCompleteTask = async (task: ReplenishmentTask) => {
    try {
      await completeTask.mutateAsync({
        id: task.id,
        dto: { fulfilledQuantity: task.requestedQuantity },
      })
      toast.success('Task completed')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to complete task')
    }
  }

  const handleCancelTask = async (task: ReplenishmentTask) => {
    try {
      await cancelTask.mutateAsync(task.id)
      toast.success('Task cancelled')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel task')
    }
  }

  const actionLoading = createTask.isPending || completeTask.isPending || cancelTask.isPending

  const suggestionColumns: ColumnDef<ReplenishmentSuggestion, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <div>
            <div className='font-medium'>{row.original.productName || row.original.productId}</div>
            {row.original.productSku && (
              <div className='text-xs text-muted-foreground'>{row.original.productSku}</div>
            )}
          </div>
        ),
        size: 220,
        minSize: 180,
        maxSize: 300,
      },
      {
        accessorKey: 'pickLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Pick Location' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.pickLocationName || row.original.pickLocationId}</span>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
      {
        accessorKey: 'currentQty',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Current Qty' />,
        cell: ({ row }) => (
          <span className='text-right font-mono text-sm'>{row.original.currentQty}</span>
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        id: 'minMax',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Min / Max' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {row.original.minQty} / {row.original.maxQty}
          </span>
        ),
        size: 100,
        minSize: 80,
        maxSize: 130,
      },
      {
        accessorKey: 'suggestedQty',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Suggested' />,
        cell: ({ row }) => (
          <span className='text-right font-mono text-sm font-medium'>{row.original.suggestedQty}</span>
        ),
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: 'bulkLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Bulk Location' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.bulkLocationName || row.original.bulkLocationId}</span>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size='sm'
            onClick={() => handleCreateTask(row.original)}
            disabled={actionLoading}
          >
            {createTask.isPending ? (
              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
            ) : (
              <ShoppingCart className='mr-1 h-3 w-3' />
            )}
            Create Task
          </Button>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
    ],
    [actionLoading, createTask.isPending, facilityId]
  )

  const activeColumns: ColumnDef<ReplenishmentTask, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Task ID' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.id.substring(0, 12)}...</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <div>
            <div className='font-medium'>{row.original.productName || row.original.productId}</div>
            {row.original.productSku && (
              <div className='text-xs text-muted-foreground'>{row.original.productSku}</div>
            )}
          </div>
        ),
        size: 200,
        minSize: 160,
        maxSize: 280,
      },
      {
        accessorKey: 'fromLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='From' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.fromLocationName || row.original.fromLocationId}</span>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
      {
        accessorKey: 'toLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='To' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.toLocationName || row.original.toLocationId}</span>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
      {
        accessorKey: 'requestedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Qty' />,
        cell: ({ row }) => (
          <span className='text-right font-mono text-sm'>{row.original.requestedQuantity}</span>
        ),
        size: 90,
        minSize: 70,
        maxSize: 120,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 110,
        minSize: 90,
        maxSize: 130,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-1'>
            <Button
              size='sm'
              variant='default'
              onClick={() => handleCompleteTask(row.original)}
              disabled={actionLoading}
            >
              {completeTask.isPending ? (
                <Loader2 className='mr-1 h-3 w-3 animate-spin' />
              ) : (
                <CheckCircle className='mr-1 h-3 w-3' />
              )}
              Complete
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleCancelTask(row.original)}
              disabled={actionLoading}
            >
              <XCircle className='mr-1 h-3 w-3' />
              Cancel
            </Button>
          </div>
        ),
        size: 200,
        minSize: 170,
        maxSize: 240,
      },
    ],
    [actionLoading, completeTask.isPending]
  )

  const historyColumns: ColumnDef<ReplenishmentTask, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Task ID' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.id.substring(0, 12)}...</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <div>
            <div className='font-medium'>{row.original.productName || row.original.productId}</div>
            {row.original.productSku && (
              <div className='text-xs text-muted-foreground'>{row.original.productSku}</div>
            )}
          </div>
        ),
        size: 200,
        minSize: 160,
        maxSize: 280,
      },
      {
        accessorKey: 'fromLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='From' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.fromLocationName || row.original.fromLocationId}</span>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
      {
        accessorKey: 'toLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='To' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.toLocationName || row.original.toLocationId}</span>
        ),
        size: 130,
        minSize: 110,
        maxSize: 160,
      },
      {
        accessorKey: 'requestedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Qty' />,
        cell: ({ row }) => (
          <span className='text-right font-mono text-sm'>{row.original.requestedQuantity}</span>
        ),
        size: 90,
        minSize: 70,
        maxSize: 120,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 110,
        minSize: 90,
        maxSize: 130,
      },
      {
        accessorKey: 'completedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Completed' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.completedAt ? new Date(row.original.completedAt).toLocaleDateString() : '—'}
          </span>
        ),
        size: 110,
        minSize: 90,
        maxSize: 140,
      },
    ],
    []
  )

  const suggestionTable = useReactTable({
    data: suggestions,
    columns: suggestionColumns,
    state: { sorting: suggestionSorting },
    onSortingChange: setSuggestionSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const activeTable = useReactTable({
    data: activeTasks,
    columns: activeColumns,
    state: { sorting: activeSorting },
    onSortingChange: setActiveSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const historyTable = useReactTable({
    data: historyTasks,
    columns: historyColumns,
    state: { sorting: historySorting },
    onSortingChange: setHistorySorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const loading = isBusy && (suggestions.length === 0 && allTasks.length === 0)

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <ShoppingCart className='h-6 w-6' />
            Replenishment
          </h1>
          <p className='text-muted-foreground'>
            Manage forward-pick replenishment from bulk storage
          </p>
        </div>
        <Button variant='outline' onClick={() => { sugRefetch(); tasksRefetch() }} disabled={isBusy}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='suggestions' className='flex items-center gap-2'>
            <ShoppingCart className='h-4 w-4' />
            Suggestions
            {suggestions.length > 0 && (
              <Badge variant='secondary' className='ml-1'>{suggestions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='active' className='flex items-center gap-2'>
            <ClipboardList className='h-4 w-4' />
            Active Tasks
            {activeTasks.length > 0 && (
              <Badge variant='secondary' className='ml-1'>{activeTasks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <History className='h-4 w-4' />
            History
            {historyTasks.length > 0 && (
              <Badge variant='secondary' className='ml-1'>{historyTasks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Suggestions Tab */}
        <TabsContent value='suggestions'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle>Replenishment Suggestions ({suggestions.length})</CardTitle>
              <CardDescription>
                Products below minimum threshold in forward-pick locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : sugError ? (
                <div className='flex flex-col items-center gap-3 py-8 text-center'>
                  <p className='font-medium text-destructive'>Failed to load suggestions</p>
                  <Button variant='outline' size='sm' onClick={() => sugRefetch()}>Retry</Button>
                </div>
              ) : suggestionTable.getRowModel().rows.length === 0 ? (
                <div className='flex flex-col items-center gap-3 py-12 text-center'>
                  <ShoppingCart className='h-10 w-10 text-muted-foreground/30' />
                  <p className='font-medium text-muted-foreground'>No suggestions</p>
                  <p className='text-sm text-muted-foreground'>
                    All forward-pick locations have sufficient stock
                  </p>
                </div>
              ) : (
                <>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        {suggestionTable.getHeaderGroups().map((hg) => (
                          <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                              <TableHead key={h.id}>
                                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {suggestionTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <DataTablePagination table={suggestionTable} className='mt-4' />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Tasks Tab */}
        <TabsContent value='active'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle>Active Replenishment Tasks ({activeTasks.length})</CardTitle>
              <CardDescription>
                Tasks awaiting completion or currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : tasksError ? (
                <div className='flex flex-col items-center gap-3 py-8 text-center'>
                  <p className='font-medium text-destructive'>Failed to load tasks</p>
                  <Button variant='outline' size='sm' onClick={() => tasksRefetch()}>Retry</Button>
                </div>
              ) : activeTable.getRowModel().rows.length === 0 ? (
                <div className='flex flex-col items-center gap-3 py-12 text-center'>
                  <ClipboardList className='h-10 w-10 text-muted-foreground/30' />
                  <p className='font-medium text-muted-foreground'>No active tasks</p>
                  <p className='text-sm text-muted-foreground'>
                    Create a task from the Suggestions tab to get started
                  </p>
                </div>
              ) : (
                <>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        {activeTable.getHeaderGroups().map((hg) => (
                          <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                              <TableHead key={h.id}>
                                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {activeTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <DataTablePagination table={activeTable} className='mt-4' />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value='history'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle>Completed Tasks ({historyTasks.length})</CardTitle>
              <CardDescription>
                Historical record of completed replenishment tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : historyTable.getRowModel().rows.length === 0 ? (
                <div className='flex flex-col items-center gap-3 py-12 text-center'>
                  <History className='h-10 w-10 text-muted-foreground/30' />
                  <p className='font-medium text-muted-foreground'>No history</p>
                  <p className='text-sm text-muted-foreground'>
                    Completed tasks will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        {historyTable.getHeaderGroups().map((hg) => (
                          <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                              <TableHead key={h.id}>
                                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {historyTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <DataTablePagination table={historyTable} className='mt-4' />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
