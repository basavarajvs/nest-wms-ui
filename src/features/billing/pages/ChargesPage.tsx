import { useState, useMemo } from 'react'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { RefreshCw, Calculator, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useChargeList, type StorageCharge } from '@/features/billing/data/billing-queries'
import { ChargeCalculateDialog } from '@/features/billing/components/ChargeCalculateDialog'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700', CALCULATED: 'bg-blue-100 text-blue-700', INVOICED: 'bg-green-100 text-green-700',
}

export function ChargesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [clientFilter, setClientFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useChargeList({ clientId: clientFilter || undefined, status: statusFilter || undefined })
  const charges: StorageCharge[] = data?.charges || []

  const columns: ColumnDef<StorageCharge, any>[] = useMemo(() => [
    { accessorKey: 'chargeType', header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />, cell: ({ row }) => <span className='text-sm font-medium'>{row.original.chargeType}</span>, size: 120, minSize: 100, maxSize: 140 },
    { accessorKey: 'clientName', header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />, cell: ({ row }) => <span className='text-sm'>{row.original.clientName || row.original.clientId || '—'}</span>, size: 180, minSize: 150, maxSize: 250 },
    { accessorKey: 'quantity', header: ({ column }) => <DataTableColumnHeader column={column} title='Qty' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>{row.original.quantity}</span>, size: 80, minSize: 70, maxSize: 110 },
    { accessorKey: 'rateApplied', header: ({ column }) => <DataTableColumnHeader column={column} title='Rate' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>${row.original.rateApplied.toFixed(2)}</span>, size: 100, minSize: 80, maxSize: 130 },
    { accessorKey: 'chargeAmount', header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />, cell: ({ row }) => <span className='text-right font-mono text-xs font-medium'>${row.original.chargeAmount.toFixed(2)}</span>, size: 110, minSize: 90, maxSize: 140 },
    { accessorKey: 'periodStart', header: ({ column }) => <DataTableColumnHeader column={column} title='Period Start' />, cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.periodStart ? new Date(row.original.periodStart).toLocaleDateString() : '—'}</span>, size: 110, minSize: 90, maxSize: 140 },
    { accessorKey: 'periodEnd', header: ({ column }) => <DataTableColumnHeader column={column} title='Period End' />, cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.periodEnd ? new Date(row.original.periodEnd).toLocaleDateString() : '—'}</span>, size: 110, minSize: 90, maxSize: 140 },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />, cell: ({ row }) => { const cls = STATUS_BADGE[row.original.status] || ''; return <Badge variant='outline' className={cls}>{row.original.status}</Badge> }, size: 100, minSize: 80, maxSize: 130 },
  ], [])

  const table = useReactTable({ data: charges, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-2xl font-bold tracking-tight'>Storage Charges</h1><p className='text-muted-foreground'>Calculated storage charges</p></div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={() => setDialogOpen(true)}><Calculator className='mr-2 h-4 w-4' />Calculate Charges</Button>
        </div>
      </div>
      <Card>
        <CardHeader className='pb-3'><CardTitle className='flex items-center gap-2 text-base'><Calculator className='h-4 w-4' />Charges</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'><Label>Client ID</Label><Input placeholder='Filter by client' value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} /></div>
            <div className='grid gap-2'><Label>Status</Label><Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger><SelectValue placeholder='All Statuses' /></SelectTrigger><SelectContent><SelectItem value='all'>All</SelectItem><SelectItem value='PENDING'>Pending</SelectItem><SelectItem value='CALCULATED'>Calculated</SelectItem><SelectItem value='INVOICED'>Invoiced</SelectItem></SelectContent></Select></div>
          </div>
          {isLoading ? <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          : isError ? <div className='flex flex-col items-center gap-4 py-12 text-center'><AlertCircle className='h-10 w-10 text-muted-foreground' /><div><p className='font-medium text-destructive'>Failed to load charges</p><p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p></div><Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button></div>
          : charges.length === 0 ? <div className='flex flex-col items-center gap-4 py-12 text-center'><Calculator className='h-10 w-10 text-muted-foreground/40' /><div><p className='font-medium'>No Charges</p><p className='text-sm text-muted-foreground'>Calculate charges from snapshots</p></div></div>
          : <div className='rounded-md border'><Table><TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <ChargeCalculateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
