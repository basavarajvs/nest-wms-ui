import { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Loader2, Check, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  useCountLines,
  useUpdateCountLine,
  useFinalizeCount,
  type CycleCount,
  type CycleCountLine,
} from '@/features/cycle-counts/data/cycle-count-queries'

const COUNT_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  SCHEDULED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  VARIANCE: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

const LINE_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  COUNTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  VERIFIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

interface CycleCountLineRow extends CycleCountLine {
  _countedQty: number | undefined
  _variance: number
}

interface CycleCountTaskDetailProps {
  count: CycleCount
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function CycleCountTaskDetail({
  count,
  open,
  onOpenChange,
  onComplete,
}: CycleCountTaskDetailProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const { data: linesData, isLoading, refetch } = useCountLines(count.id)
  const updateLine = useUpdateCountLine()
  const finalizeCount = useFinalizeCount()

  const lines = linesData?.lines ?? []

  const [countedMap, setCountedMap] = useState<Record<string, string>>({})

  const isBlind = count.countMethod?.toUpperCase() === 'BLIND'

  const handleCountedChange = useCallback((lineId: string, value: string) => {
    setCountedMap((prev) => ({ ...prev, [lineId]: value }))
  }, [])

  const handleSubmitLine = useCallback(async (line: CycleCountLine) => {
    const countedStr = countedMap[line.id] ?? ''
    const countedQty = countedStr ? Number(countedStr) : undefined
    if (countedQty === undefined || isNaN(countedQty)) {
      toast.error('Please enter a valid counted quantity')
      return
    }
    try {
      await updateLine.mutateAsync({
        id: line.id,
        dto: { countedQuantity: countedQty, status: 'COUNTED' },
      })
      toast.success('Line counted successfully')
      refetch()
    } catch {
      toast.error('Failed to submit count line')
    }
  }, [countedMap, updateLine, refetch])

  const handleFinalize = useCallback(async () => {
    try {
      await finalizeCount.mutateAsync(count.id)
      toast.success('Count completed')
      onComplete()
      onOpenChange(false)
    } catch {
      toast.error('Failed to complete count')
    }
  }, [finalizeCount, count.id, onComplete, onOpenChange])

  const linesWithVariance = useMemo((): CycleCountLineRow[] => {
    return lines.map((line) => {
      const countedStr = countedMap[line.id]
      const countedQty = countedStr !== undefined && countedStr !== '' ? Number(countedStr) : line.countedQuantity
      const expectedQty = line.systemQuantity ?? 0
      const variance = countedQty !== undefined && !isNaN(countedQty) ? countedQty - expectedQty : (line.variance ?? 0)
      return { ...line, _countedQty: countedQty, _variance: variance }
    })
  }, [lines, countedMap])

  const varianceSummary = useMemo(() => {
    const discrepancies = linesWithVariance.filter((l) => l._variance !== 0)
    const totalExpected = linesWithVariance.reduce((s, l) => s + (l.systemQuantity ?? 0), 0)
    const totalCounted = linesWithVariance.reduce((s, l) => s + (l._countedQty ?? 0), 0)
    const submittedCount = lines.filter((l) => l.status === 'COUNTED' || l.status === 'VERIFIED').length
    return { discrepancies, totalExpected, totalCounted, submittedCount, total: lines.length }
  }, [linesWithVariance, lines])

  const isFinalizing = finalizeCount.isPending

  const columns: ColumnDef<CycleCountLineRow, any>[] = useMemo(
    () => [
      {
        id: 'rowNum',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>{row.index + 1}</span>
        ),
      },
      {
        accessorKey: 'locationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.locationName || row.original.locationId?.substring(0, 8) || '—'}</span>
        ),
      },
      {
        accessorKey: 'productSku',
        header: ({ column }) => <DataTableColumnHeader column={column} title='SKU' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.productSku || '—'}</span>
        ),
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <span className='text-sm'>{row.original.productName || '—'}</span>
        ),
      },
      ...(isBlind
        ? []
        : [{
            accessorKey: 'systemQuantity' as const,
            header: ({ column }: { column: any }) => (
              <DataTableColumnHeader column={column} title='Expected' />
            ),
            cell: ({ row }: { row: any }) => (
              <span className='text-right font-mono text-sm'>{row.original.systemQuantity ?? '—'}</span>
            ),
            meta: { align: 'right' as const },
          } as ColumnDef<CycleCountLineRow, any>]
      ),
      {
        id: 'counted',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Counted' />,
        cell: ({ row }) => (
          <div className='text-right'>
            <Input
              className='h-8 w-20 text-right font-mono text-sm'
              type='number'
              min={0}
              placeholder='—'
              value={countedMap[row.original.id] ?? row.original.countedQuantity ?? ''}
              onChange={(e) => handleCountedChange(row.original.id, e.target.value)}
            />
          </div>
        ),
      },
      {
        id: 'variance',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Variance' />,
        cell: ({ row }) => (
          <span
            className={`font-mono text-sm font-medium ${
              row.original._variance !== 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {row.original._variance != null
              ? row.original._variance > 0
                ? `+${row.original._variance}`
                : String(row.original._variance)
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => (
          <Badge
            variant='outline'
            className={`${LINE_STATUS_STYLES[row.original.status || 'PENDING'] || ''} text-xs`}
          >
            {row.original.status?.replace(/_/g, ' ') || 'PENDING'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => (
          <Button
            variant='outline'
            size='sm'
            className='h-7 text-xs'
            disabled={updateLine.isPending}
            onClick={() => handleSubmitLine(row.original)}
          >
            <Save className='mr-1 h-3 w-3' />
            Submit
          </Button>
        ),
      },
    ],
    [isBlind, countedMap, handleCountedChange, handleSubmitLine, updateLine.isPending]
  )

  const table = useReactTable({
    data: linesWithVariance,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[900px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            Count Execution
            <Badge
              variant='outline'
              className={COUNT_STATUS_STYLES[count.status || ''] || ''}
            >
              {count.status?.replace(/_/g, ' ') || '—'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <div className='mt-2 grid grid-cols-2 gap-2 text-sm'>
              <span>
                <span className='text-muted-foreground'>Count #:</span>{' '}
                <span className='font-mono font-medium'>{count.countNumber || count.id.substring(0, 12)}</span>
              </span>
              <span>
                <span className='text-muted-foreground'>Method:</span>{' '}
                <Badge variant='outline'>{count.countMethod || '—'}</Badge>
              </span>
              <span>
                <span className='text-muted-foreground'>Scope:</span>{' '}
                {count.scopeType || '—'}{count.scopeIdentifier ? ` (${count.scopeIdentifier})` : ''}
              </span>
              <span>
                <span className='text-muted-foreground'>Expected Items:</span>{' '}
                {count.totalItems ?? '—'}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        {isBlind && (
          <div className='rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'>
            <AlertTriangle className='mr-2 inline-block h-4 w-4' />
            Blind count — expected quantities are hidden. Enter your count without bias.
          </div>
        )}

        {/* Items Table */}
        {isLoading ? (
          <div className='space-y-2 py-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : linesWithVariance.length === 0 ? (
          <div className='py-8 text-center text-sm text-muted-foreground'>
            No count lines found for this count.
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
                {table.getRowModel().rows.map((row) => {
                  const hasDiscrepancy =
                    row.original._variance !== 0 &&
                    (row.original.status === 'COUNTED' ||
                      row.original.status === 'VERIFIED' ||
                      (countedMap[row.original.id] && countedMap[row.original.id] !== ''))
                  return (
                    <TableRow
                      key={row.id}
                      className={hasDiscrepancy ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Variance Summary */}
        {varianceSummary.discrepancies.length > 0 && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20'>
            <div className='flex items-center gap-2 text-sm font-medium text-destructive'>
              <AlertTriangle className='h-4 w-4' />
              Discrepancies Found ({varianceSummary.discrepancies.length} items)
            </div>
            <div className='mt-1 space-y-1 text-sm text-red-700 dark:text-red-400'>
              {varianceSummary.discrepancies.slice(0, 5).map((d) => (
                <div key={d.id} className='flex items-center gap-2'>
                  <span className='font-mono text-xs'>{d.locationName || d.locationId?.substring(0, 8)}</span>
                  <span>{d.productName || d.productSku}</span>
                  <span className='ml-auto font-mono'>
                    Expected: {d.systemQuantity ?? '?'} → Counted: {d._countedQty ?? '?'}
                    <span className='ml-1 font-bold'>
                      ({d._variance > 0 ? '+' : ''}{d._variance})
                    </span>
                  </span>
                </div>
              ))}
              {varianceSummary.discrepancies.length > 5 && (
                <p className='text-xs text-muted-foreground'>
                  ...and {varianceSummary.discrepancies.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Summary footer */}
        <div className='flex items-center justify-between border-t pt-4'>
          <div className='text-sm text-muted-foreground'>
            {varianceSummary.submittedCount} / {varianceSummary.total} lines counted
            {varianceSummary.totalCounted > 0 && (
              <span className='ml-2'>
                (Expected: {varianceSummary.totalExpected} | Counted: {varianceSummary.totalCounted})
              </span>
            )}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => refetch()} disabled={isLoading}>
              Refresh
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={varianceSummary.submittedCount === 0 || isFinalizing}
            >
              {isFinalizing ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Check className='mr-2 h-4 w-4' />
              )}
              Complete Count
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
