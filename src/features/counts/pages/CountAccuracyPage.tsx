import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  RefreshCw,
  AlertCircle,
  Target,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useCountAccuracy,
  type CountAccuracyRecord,
} from '@/features/counts/data/count-metrics-queries'
import { useFacility } from '@/hooks/useFacility'

function AccuracyScoreBadge({ score }: { score: number }) {
  if (score >= 0.98) return <Badge variant='outline' className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>{(score * 100).toFixed(1)}%</Badge>
  if (score >= 0.9) return <Badge variant='outline' className='bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'>{(score * 100).toFixed(1)}%</Badge>
  return <Badge variant='outline' className='bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>{(score * 100).toFixed(1)}%</Badge>
}

function VarianceBadge({ variance }: { variance: number }) {
  const abs = Math.abs(variance)
  const prefix = variance > 0 ? '+' : ''
  if (variance === 0) return <Badge variant='outline' className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>0</Badge>
  if (variance > 0) return <Badge variant='outline' className='bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'>{prefix}{variance}</Badge>
  return <Badge variant='outline' className='bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>{variance}</Badge>
}

export function CountAccuracyPage() {
  const { selectedFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [productFilter, setProductFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useCountAccuracy({
    productId: productFilter || undefined,
    facilityId: selectedFacility?.id || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  })

  const records: CountAccuracyRecord[] = data?.records || []
  const total = data?.total ?? records.length

  const columns: ColumnDef<CountAccuracyRecord, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{r.productName || r.productId}</span>
              {r.productSku && <span className='text-xs text-muted-foreground'>{r.productSku}</span>}
            </div>
          )
        },
      },
      {
        accessorKey: 'locationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.locationName || row.original.locationId}</span>
        ),
      },
      {
        accessorKey: 'systemQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='System Qty' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.systemQuantity}</span>,
      },
      {
        accessorKey: 'countedQuantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Counted Qty' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.countedQuantity}</span>,
      },
      {
        accessorKey: 'variance',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Variance' />,
        cell: ({ row }) => <VarianceBadge variance={row.original.variance} />,
      },
      {
        accessorKey: 'accuracyScore',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Accuracy' />,
        cell: ({ row }) => <AccuracyScoreBadge score={row.original.accuracyScore} />,
      },
      {
        accessorKey: 'recordedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Recorded' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground whitespace-nowrap'>
            {new Date(row.original.recordedAt).toLocaleString()}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Count Accuracy</h1>
          <p className='text-muted-foreground'>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </p>
        </div>
        <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Target className='h-4 w-4' />
            Accuracy Records
          </CardTitle>
          <CardDescription>System vs counted quantities per product-location pair</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Product ID / SKU</Label>
              <Input
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder='Filter by product...'
              />
            </div>
            <div className='grid gap-2'>
              <Label>From Date</Label>
              <Input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>To Date</Label>
              <Input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium text-destructive'>Failed to load accuracy records</p>
                <p className='text-sm text-muted-foreground'>
                  {(error as any)?.message || 'An unexpected error occurred'}
                </p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : records.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <Target className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Accuracy Records</p>
                <p className='text-sm text-muted-foreground'>
                  No cycle count accuracy data available for the selected filters
                </p>
              </div>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
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
          )}

          {records.length > 0 && (
            <p className='text-sm text-muted-foreground'>{total} record{total !== 1 ? 's' : ''}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
