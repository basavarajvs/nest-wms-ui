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
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  useLowStockAlerts,
  type LowStockAlert,
} from '@/features/inventory/low-stock/data/low-stock-queries'

export function LowStockList() {
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

  const { data, isLoading, isError, error, refetch, isFetching } =
    useLowStockAlerts({
      facilityId: selectedFacility?.id || '',
      page: 1,
      limit: 100,
    })

  const alerts: LowStockAlert[] = data?.alerts || []

  const columns: ColumnDef<LowStockAlert, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Product' />
        ),
        cell: ({ row }) => (
          <div>
            <div className='font-medium'>
              {row.getValue('productName') ||
                row.original.productSku ||
                row.original.productId ||
                '—'}
            </div>
            <div className='text-xs text-muted-foreground'>
              {row.original.productSku}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'locationId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Location' />
        ),
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.getValue('locationId') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'onHand',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='On Hand' />
        ),
        cell: ({ row }) => (
          <span className='text-right font-mono'>
            {row.getValue('onHand') ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'available',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Available' />
        ),
        cell: ({ row }) => (
          <span className='text-right font-mono'>
            {row.getValue('available') ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'threshold',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Threshold' />
        ),
        cell: ({ row }) => (
          <span className='text-right font-mono'>
            {row.getValue('threshold') ?? '—'}
          </span>
        ),
      },
      {
        id: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: () => <Badge variant='destructive'>Low Stock</Badge>,
      },
    ],
    []
  )

  const table = useReactTable({
    data: alerts,
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
          <h1 className='text-2xl font-bold tracking-tight'>
            Low Stock Alerts
          </h1>
          <p className='text-muted-foreground'>
            Products below configured thresholds that need attention
          </p>
        </div>
        <Button
          variant='outline'
          onClick={() => {
            refetch()
            toast.info('Refreshing alerts...')
          }}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />{' '}
          Refresh
        </Button>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by product SKU...'
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>
            Alerts {alerts.length ? `(${alerts.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='h-9 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load alerts
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
              <AlertTriangle className='h-8 w-8 text-muted-foreground' />
              <p className='text-muted-foreground'>No low stock alerts</p>
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
