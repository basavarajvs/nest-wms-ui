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
import { Eye } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { QcStatusBadge } from '@/components/status-badges'
import {
  useQualityInspections,
  type QualityInspection,
} from '../data/quality-queries'

interface InspectionListProps {
  onViewDetail?: (inspection: QualityInspection) => void
}

export function InspectionList({ onViewDetail }: InspectionListProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const { data, isLoading, error, refetch } = useQualityInspections({ page: 1, limit: 100 })
  const inspections = data?.inspections ?? []

  const columns: ColumnDef<QualityInspection, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Inspection ID' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.original.id.substring(0, 12)}...
          </span>
        ),
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Product' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>
            {row.original.productName || row.original.productSku || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
          const raw = row.original.status?.toUpperCase() || row.original.qcResult || 'PENDING'
          const mapped = raw === 'PASS' ? 'PASSED' : raw === 'FAIL' ? 'FAILED' : raw
          return <QcStatusBadge status={mapped as any} />
        },
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'qcResult',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Result' />
        ),
        cell: ({ row }) => (
          <span>{row.original.qcResult || '—'}</span>
        ),
      },
      {
        accessorKey: 'inspectorName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Inspector' />
        ),
        cell: ({ row }) => (
          <span>{row.original.inspectorName || '—'}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Date' />
        ),
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className='text-right'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => onViewDetail?.(row.original)}
            >
              <Eye className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    [onViewDetail]
  )

  const table = useReactTable({
    data: inspections,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle>Quality Inspections</CardTitle>
        <CardDescription>{data?.total ?? inspections.length} inspections</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableToolbar
          table={table}
          searchKey='productName'
          searchPlaceholder='Filter by product...'
          filters={[
            {
              columnId: 'status',
              title: 'Result',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Passed', value: 'passed' },
                { label: 'Failed', value: 'failed' },
              ],
            },
          ]}
        />
        {isLoading ? (
          <div className='mt-4 space-y-2'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        ) : error ? (
          <div className='flex flex-col items-center gap-2 py-8 text-center'>
            <p className='font-medium text-destructive'>Failed to load inspections</p>
            <p className='text-sm text-muted-foreground'>
              {(error as any)?.message || 'An unexpected error occurred'}
            </p>
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : table.getRowModel().rows.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-12 text-center'>
            <p className='font-medium text-muted-foreground'>No inspections found</p>
            <p className='text-sm text-muted-foreground'>Inspections will appear here once GRN lines are inspected.</p>
          </div>
        ) : (
          <>
            <div className='mt-4 rounded-md border'>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  )
}
