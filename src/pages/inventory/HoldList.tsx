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
import { RefreshCw, Ban } from 'lucide-react'
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
  useHolds,
  type Hold,
} from '@/features/inventory/holds/data/hold-queries'

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Released', value: 'released' },
  { label: 'Expired', value: 'expired' },
]

const STATUS_BADGE: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'destructive',
  released: 'outline',
  expired: 'secondary',
}

const TYPE_FILTER_OPTIONS = [
  { label: 'Quality', value: 'quality' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Customer', value: 'customer' },
  { label: 'Other', value: 'other' },
]

export function HoldList() {
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

  const { data, isLoading, isError, error, refetch, isFetching } = useHolds({
    page: 1,
    limit: 100,
  })
  const { selectedFacility } = useFacility()

  const holds: Hold[] = data?.holds || []

  const columns: ColumnDef<Hold, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Product' />
        ),
        cell: ({ row }) => (
          <div>
            <div className='font-medium'>
              {row.getValue('productName') || row.original.productId || '—'}
            </div>
            <div className='text-xs text-muted-foreground'>
              {row.original.locationId || ''}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'productSku',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='SKU' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.getValue('productSku') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'holdType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Hold Type' />
        ),
        cell: ({ row }) => (
          <span className='capitalize'>{row.getValue('holdType') || '—'}</span>
        ),
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'reason',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Reason' />
        ),
        cell: ({ row }) => (
          <span className='block max-w-[160px] truncate text-xs text-muted-foreground'>
            {row.getValue('reason') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Qty' />
        ),
        cell: ({ row }) => (
          <span className='text-right font-mono'>
            {row.original.quantity ?? row.original.qty ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
          const status = (row.getValue('status') as string) || 'active'
          return (
            <Badge variant={STATUS_BADGE[status] || 'secondary'}>
              {status}
            </Badge>
          )
        },
        filterFn: 'arrIncludesSome',
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
        accessorKey: 'releasedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Released' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('releasedAt') as string | undefined
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
          const h = row.original
          return (
            <div className='text-right'>
              {h.status === 'active' && (
                <Button
                  size='sm'
                  variant='outline'
                  disabled
                  title='Release hold endpoint not available'
                >
                  Release
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
    data: holds,
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
          <h1 className='text-2xl font-bold tracking-tight'>Stock Holds</h1>
          <p className='text-muted-foreground'>
            View and manage stock that has been placed on hold
          </p>
        </div>
        <Button
          variant='outline'
          onClick={() => {
            refetch()
            toast.info('Refreshing holds...')
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
        searchPlaceholder='Filter by product or location...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
          {
            columnId: 'holdType',
            title: 'Hold Type',
            options: TYPE_FILTER_OPTIONS,
          },
        ]}
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Holds {holds.length ? `(${holds.length})` : ''}</CardTitle>
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
                Failed to load holds
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
              <Ban className='h-12 w-12 text-muted-foreground/30' />
              <p className='font-medium text-muted-foreground'>
                No holds found
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
    </div>
  )
}
