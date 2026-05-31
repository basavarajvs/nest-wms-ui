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
import { Plus, RefreshCw } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  useWaveBoard,
  useCreateWave,
  type WaveTask,
} from '@/features/outbound/waves/data/wave-queries'

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
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  const {
    data: waves,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useWaveBoard({})
  const createMutation = useCreateWave()
  const { selectedFacility } = useFacility()

  const waveTasks: WaveTask[] = waves || []

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

  const onCreate = async () => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({ facilityId: selectedFacility.id })
      toast.success('Picking Wave created successfully')
      setDialogOpen(false)
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to create wave'
      )
    }
  }

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' /> New Wave
            </Button>
            <DialogContent className='sm:max-w-[440px]'>
              <DialogHeader>
                <DialogTitle>Create Picking Wave</DialogTitle>
                <DialogDescription>
                  Generate a new picking wave for the selected facility
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                {selectedFacility && (
                  <div className='rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground'>
                    Facility:{' '}
                    <span className='font-medium text-foreground'>
                      {selectedFacility.facilityCode} —{' '}
                      {selectedFacility.facilityName}
                    </span>
                  </div>
                )}
                {!selectedFacility && (
                  <p className='text-sm text-muted-foreground'>
                    Select a facility from the top bar first
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={createMutation.isPending || !selectedFacility}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Wave'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
