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
import { RefreshCw, Send, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
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
  useTransfers,
  useDispatchTransfer,
  type Transfer,
} from '@/features/transfers/data/transfer-queries'

const STATUS_FILTER_OPTIONS = [
  { label: 'Created', value: 'CREATED' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

const TYPE_FILTER_OPTIONS = [
  { label: 'Internal', value: 'INTERNAL' },
  { label: 'Inter-Facility', value: 'INTER_FACILITY' },
  { label: 'Return', value: 'RETURN' },
  { label: 'Customer', value: 'CUSTOMER' },
]

const STATUS_STYLES: Record<string, string> = {
  CREATED:
    'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  DISPATCHED:
    'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  IN_TRANSIT:
    'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  RECEIVED:
    'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED:
    'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED:
    'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

interface TransferListProps {
  onCreateClick?: () => void
}

export function TransferList({ onCreateClick }: TransferListProps) {
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

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = useTransfers(
    {
      page: 1,
      limit: 100,
      facilityId: selectedFacility?.id,
    }
  )

  const dispatchMutation = useDispatchTransfer()

  const transfers: Transfer[] = data?.transfers || []

  const canDispatch = (t: Transfer) =>
    t.id &&
    t.status !== 'DISPATCHED' &&
    t.status !== 'IN_TRANSIT' &&
    t.status !== 'RECEIVED' &&
    t.status !== 'COMPLETED' &&
    t.status !== 'CANCELLED'

  const columns: ColumnDef<Transfer, any>[] = useMemo(
    () => [
      {
        accessorKey: 'transferNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Transfer #' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-sm font-medium'>
            {row.getValue('transferNumber') ||
              row.original.id?.substring(0, 12) + '...' ||
              '—'}
          </span>
        ),
      },
      {
        accessorKey: 'transferType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <Badge variant='outline'>{row.getValue('transferType') || '—'}</Badge>
        ),
        filterFn: 'arrIncludesSome',
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
              className={`${STATUS_STYLES[status] || ''} capitalize`}
            >
              {status.replace(/_/g, ' ')}
            </Badge>
          )
        },
        filterFn: 'arrIncludesSome',
      },
      {
        id: 'from',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='From' />
        ),
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.fromLocationId || row.original.fromFacilityId || '—'}
          </span>
        ),
      },
      {
        id: 'to',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='To' />
        ),
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.toLocationId || row.original.toFacilityId || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Created' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string | undefined
          return (
            <span className='text-xs text-muted-foreground'>
              {date ? new Date(date).toLocaleDateString() : '—'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className='flex justify-end gap-1'>
              {canDispatch(t) && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleDispatch(t.id!)}
                  disabled={dispatchMutation.isPending}
                >
                  <Send className='mr-1 h-3 w-3' /> Dispatch
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: transfers,
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

  const handleDispatch = async (id: string) => {
    try {
      await dispatchMutation.mutateAsync(id)
      toast.success('Transfer dispatched successfully')
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to dispatch transfer'
      )
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Transfers</h1>
          <p className='text-muted-foreground'>
            Intra and inter-facility inventory movements
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
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className='mr-2 h-4 w-4' /> New Transfer
            </Button>
          )}
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by number, ID, or location...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
          {
            columnId: 'transferType',
            title: 'Type',
            options: TYPE_FILTER_OPTIONS,
          },
        ]}
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Transfers ({transfers.length})</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load transfers
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
              <p className='font-medium text-muted-foreground'>
                No transfers found
              </p>
              {!onCreateClick && (
                <Button size='sm' onClick={onCreateClick!}>
                  <Plus className='mr-2 h-4 w-4' /> Create Transfer
                </Button>
              )}
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
