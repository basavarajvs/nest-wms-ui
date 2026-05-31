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
import { RefreshCw } from 'lucide-react'
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
  useStockLevels,
  type StockLevel,
} from '@/features/inventory/stock/data/stock-queries'

export function StockList() {
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
  const [page, setPage] = useState(1)
  const limit = 50

  const { selectedFacility } = useFacility()

  const params = {
    facilityId: selectedFacility?.id || '',
    productId: '',
    locationId: '',
    lotId: '',
    productName: '',
    lowStock: false,
    page,
    limit,
  }

  const { data, isLoading, isError, error, refetch, isFetching } =
    useStockLevels(params)

  const levels: StockLevel[] = data?.levels || []

  const columns: ColumnDef<StockLevel, any>[] = useMemo(
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
              {row.original.productId}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'locationId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Location / Lot' />
        ),
        cell: ({ row }) => (
          <div>
            <div>{row.getValue('locationId') || '—'}</div>
            {row.original.lotId && (
              <div className='text-xs text-muted-foreground'>
                Lot: {row.original.lotId}
              </div>
            )}
          </div>
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
        accessorKey: 'allocated',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Allocated' />
        ),
        cell: ({ row }) => (
          <span className='text-right font-mono'>
            {row.getValue('allocated') ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'reserved',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Reserved' />
        ),
        cell: ({ row }) => (
          <span className='text-right font-mono'>
            {row.getValue('reserved') ?? '—'}
          </span>
        ),
      },
      {
        id: 'available',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Available' />
        ),
        cell: ({ row }) => {
          const s = row.original
          const available =
            s.available ??
            (s.onHand != null
              ? s.onHand - (s.allocated || 0) - (s.reserved || 0)
              : undefined)
          return (
            <span className='text-right font-mono'>{available ?? '—'}</span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
          const s = row.original
          return (
            <Badge
              variant={
                s.status === 'low' || (s.available != null && s.available < 0)
                  ? 'destructive'
                  : 'outline'
              }
            >
              {s.status ||
                (s.available != null && s.available <= 0
                  ? 'out of stock'
                  : 'in stock')}
            </Badge>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: levels,
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
          <h1 className='text-2xl font-bold tracking-tight'>Stock Levels</h1>
          <p className='text-muted-foreground'>
            Current inventory positions across facilities and locations
          </p>
        </div>
        <Button
          variant='outline'
          onClick={() => {
            refetch()
            toast.info('Refreshing stock levels...')
          }}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by product name or ID...'
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>
            Stock Positions {levels.length ? `(${levels.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load stock levels
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
              <p className='text-muted-foreground'>
                No stock records match the current filters
              </p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
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
