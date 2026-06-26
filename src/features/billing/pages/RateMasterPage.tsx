import { useState, useMemo } from 'react'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { RefreshCw, Plus, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useRateList, type StorageRate } from '@/features/billing/data/billing-queries'
import { RateDialog } from '@/features/billing/components/RateDialog'

const RATE_TYPE_BADGE: Record<string, string> = {
  PER_PALLET: 'bg-blue-100 text-blue-700', PER_SQFT: 'bg-purple-100 text-purple-700',
  PER_CUBIC_FOOT: 'bg-cyan-100 text-cyan-700', FLAT: 'bg-slate-100 text-slate-700',
}

export function RateMasterPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useRateList({ rateType: typeFilter || undefined })
  const rates: StorageRate[] = data?.rates || []

  const columns: ColumnDef<StorageRate, any>[] = useMemo(() => [
    { accessorKey: 'rateCode', header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />, cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.rateCode}</span> },
    { accessorKey: 'rateName', header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />, cell: ({ row }) => <span className='text-sm font-medium'>{row.original.rateName}</span> },
    { accessorKey: 'rateType', header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />, cell: ({ row }) => { const cls = RATE_TYPE_BADGE[row.original.rateType] || ''; return <Badge variant='outline' className={cls}>{row.original.rateType?.replace(/_/g, ' ')}</Badge> } },
    { accessorKey: 'calculationBasis', header: ({ column }) => <DataTableColumnHeader column={column} title='Basis' />, cell: ({ row }) => <span className='text-xs capitalize'>{row.original.calculationBasis?.toLowerCase()}</span> },
    { accessorKey: 'defaultRate', header: ({ column }) => <DataTableColumnHeader column={column} title='Default Rate' />, cell: ({ row }) => <span className='font-mono text-xs'>${row.original.defaultRate.toFixed(2)}</span> },
    { accessorKey: 'minCharge', header: ({ column }) => <DataTableColumnHeader column={column} title='Min' />, cell: ({ row }) => <span className='font-mono text-xs text-muted-foreground'>{row.original.minCharge != null ? `$${row.original.minCharge.toFixed(2)}` : '—'}</span> },
    { accessorKey: 'maxCharge', header: ({ column }) => <DataTableColumnHeader column={column} title='Max' />, cell: ({ row }) => <span className='font-mono text-xs text-muted-foreground'>{row.original.maxCharge != null ? `$${row.original.maxCharge.toFixed(2)}` : '—'}</span> },
    { accessorKey: 'isActive', header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />, cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'secondary'} className='text-xs'>{row.original.isActive ? 'Active' : 'Inactive'}</Badge> },
  ], [])

  const table = useReactTable({ data: rates, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-2xl font-bold tracking-tight'>Rate Master</h1><p className='text-muted-foreground'>Storage rate definitions</p></div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />New Rate</Button>
        </div>
      </div>
      <Card>
        <CardHeader className='pb-3'><CardTitle className='flex items-center gap-2 text-base'><DollarSign className='h-4 w-4' />All Rates</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Rate Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder='All Types' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='PER_PALLET'>Per Pallet</SelectItem>
                  <SelectItem value='PER_SQFT'>Per Sq Ft</SelectItem>
                  <SelectItem value='PER_CUBIC_FOOT'>Per Cubic Ft</SelectItem>
                  <SelectItem value='FLAT'>Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoading ? <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          : isError ? <div className='flex flex-col items-center gap-4 py-12 text-center'><AlertCircle className='h-10 w-10 text-muted-foreground' /><div><p className='font-medium text-destructive'>Failed to load rates</p><p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p></div><Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button></div>
          : rates.length === 0 ? <div className='flex flex-col items-center gap-4 py-12 text-center'><DollarSign className='h-10 w-10 text-muted-foreground/40' /><div><p className='font-medium'>No Rates</p><p className='text-sm text-muted-foreground'>No storage rates found</p></div></div>
          : <div className='rounded-md border'><Table><TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <RateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
