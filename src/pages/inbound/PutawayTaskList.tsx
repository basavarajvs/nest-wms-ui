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
import { RefreshCw, Layers } from 'lucide-react'
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
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import {
  usePutawayBoard,
  type PutawayTask,
} from '@/features/inbound/putaway-board/data/putaway-queries'

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

const PRIORITY_BADGE_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  '1': 'secondary',
  '2': 'outline',
  '3': 'default',
  '5': 'destructive',
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending:
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  assigned:
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress:
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  completed:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  on_hold:
    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
}

export function PutawayTaskList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })

  const { data, isLoading, isError, error, refetch, isFetching } =
    usePutawayBoard({
      page: 1,
      limit: 100,
    })

  const tasks: PutawayTask[] = data?.items || []

  const columns: ColumnDef<PutawayTask, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='ID' />
        ),
        cell: ({ row }) => (
          <span className='block max-w-[120px] truncate font-mono text-xs'>
            {row.original.id?.substring(0, 12) + '...' || '—'}
          </span>
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
              {(status || '—').replace('_', ' ')}
            </Badge>
          )
        },
        filterFn: 'arrIncludesSome',
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
        accessorKey: 'productId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Product' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.getValue('productId') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Qty' />
        ),
        cell: ({ row }) => <span>{row.getValue('quantity') ?? '—'}</span>,
      },
      {
        accessorKey: 'suggestedLocationId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Suggested Location' />
        ),
        cell: ({ row }) => (
          <span className='block max-w-[120px] truncate font-mono text-xs'>
            {row.getValue('suggestedLocationId') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'assignedToUserId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Assigned To' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('assignedToUserId') as string | undefined
          return (
            <span className='font-mono text-xs'>
              {val ? val.substring(0, 12) + '...' : '—'}
            </span>
          )
        },
      },
    ],
    []
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
  )
}
