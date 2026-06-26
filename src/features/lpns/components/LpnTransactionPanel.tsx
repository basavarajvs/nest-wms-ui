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
  ArrowRight,
  AlertCircle,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  useLpnTransactions,
  useAllLpnTransactions,
  type LpnTransaction,
} from '@/features/lpns/data/lpn-transaction-queries'
import { useFacility } from '@/hooks/useFacility'

const TRANSACTION_TYPE_OPTIONS = [
  'CREATE',
  'MOVE',
  'SPLIT',
  'MERGE',
  'PICK',
  'PACK',
  'SHIP',
  'ADJUST',
  'DISPOSE',
] as const

const TRANSACTION_TYPE_BADGE: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MOVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SPLIT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  MERGE: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PICK: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PACK: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SHIP: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  ADJUST: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DISPOSE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function TransactionTypeBadge({ type }: { type: string }) {
  const cls = TRANSACTION_TYPE_BADGE[type] || ''
  return (
    <Badge variant='outline' className={`${cls} font-mono text-xs`}>
      {type}
    </Badge>
  )
}

interface LpnTransactionPanelProps {
  lpnId?: string
}

export function LpnTransactionPanel({ lpnId }: LpnTransactionPanelProps) {
  const { selectedFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [typeFilter, setTypeFilter] = useState('')

  const allQuery = useAllLpnTransactions({
    transactionType: typeFilter || undefined,
    facilityId: selectedFacility?.id || undefined,
  })
  const byLpnQuery = useLpnTransactions(lpnId || '')
  const query = lpnId ? byLpnQuery : allQuery
  const { data, isLoading, isError, error, refetch, isFetching } = query

  const transactions: LpnTransaction[] = lpnId
    ? (data as { transactions?: LpnTransaction[]; total?: number })?.transactions ?? []
    : (data as { transactions?: LpnTransaction[]; total?: number })?.transactions ?? []

  const columns: ColumnDef<LpnTransaction, any>[] = useMemo(
    () => [
      {
        accessorKey: 'transactionType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        cell: ({ row }) => <TransactionTypeBadge type={row.original.transactionType} />,
      },
      {
        id: 'fromTo',
        header: 'Location',
        cell: ({ row }) => {
          const t = row.original
          return (
            <span className='flex items-center gap-1.5 text-xs'>
              <span className='font-mono'>{t.fromLocationName || t.fromLocationId || '—'}</span>
              <ArrowRight className='h-3 w-3 text-muted-foreground' />
              <span className='font-mono'>{t.toLocationName || t.toLocationId || '—'}</span>
            </span>
          )
        },
        enableSorting: false,
      },
      {
        id: 'quantityChange',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Qty Change' />,
        cell: ({ row }) => {
          const change = row.original.quantityChange
          const before = row.original.quantityBefore
          const after = row.original.quantityAfter
          if (change === undefined || change === null) return <span className='text-xs text-muted-foreground'>—</span>
          const isPositive = change > 0
          const isNegative = change < 0
          return (
            <span className='flex items-center gap-2 font-mono text-xs'>
              {before !== undefined && (
                <span className='text-muted-foreground'>{before} →</span>
              )}
              <span className={isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-600 dark:text-red-400' : ''}>
                {isPositive ? '+' : ''}{change}
              </span>
              {after !== undefined && (
                <span className='text-muted-foreground'>→ {after}</span>
              )}
            </span>
          )
        },
      },
      {
        accessorKey: 'referenceType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Reference' />,
        cell: ({ row }) => {
          const refType = row.original.referenceType
          const refId = row.original.referenceId
          return (
            <span className='text-xs text-muted-foreground'>
              {refType ? `${refType}${refId ? ` #${refId.substring(0, 8)}` : ''}` : '—'}
            </span>
          )
        },
      },
      {
        accessorKey: 'performedBy',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Performed By' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.performedBy || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'transactionAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground whitespace-nowrap'>
            {row.original.transactionAt
              ? new Date(row.original.transactionAt).toLocaleString()
              : '—'}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const filterSection = (
    <div className='grid max-w-xs gap-2'>
      <Label>Transaction Type</Label>
      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder='All Types' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Types</SelectItem>
          {TRANSACTION_TYPE_OPTIONS.map((t) => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {filterSection}
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className='space-y-4'>
        {filterSection}
        <div className='flex flex-col items-center gap-4 py-12 text-center'>
          <AlertCircle className='h-10 w-10 text-muted-foreground' />
          <div>
            <p className='font-medium text-destructive'>Failed to load transactions</p>
            <p className='text-sm text-muted-foreground'>
              {(error as any)?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className='space-y-4'>
        {filterSection}
        <div className='flex flex-col items-center gap-4 py-12 text-center'>
          <History className='h-10 w-10 text-muted-foreground/40' />
          <div>
            <p className='font-medium'>No LPN Transactions</p>
            <p className='text-sm text-muted-foreground'>
              {lpnId
                ? 'No transactions recorded for this LPN'
                : typeFilter
                  ? `No ${typeFilter} transactions found`
                  : 'No LPN transactions recorded yet'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {filterSection}
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
    </div>
  )
}
