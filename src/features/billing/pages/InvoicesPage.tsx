import { useState, useMemo } from 'react'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { RefreshCw, FileText, AlertCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useInvoiceList, type Invoice } from '@/features/billing/data/billing-queries'
import { InvoiceGenerateDialog } from '@/features/billing/components/InvoiceGenerateDialog'
import { InvoiceDetailDialog } from '@/features/billing/components/InvoiceDetailDialog'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700', OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-amber-100 text-amber-700',
}

export function InvoicesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [clientFilter, setClientFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useInvoiceList({ clientId: clientFilter || undefined, status: statusFilter || undefined })
  const invoices: Invoice[] = data?.invoices || []

  const columns: ColumnDef<Invoice, any>[] = useMemo(() => [
    { accessorKey: 'invoiceNumber', header: ({ column }) => <DataTableColumnHeader column={column} title='Invoice' />, cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.invoiceNumber || row.original.id.substring(0, 12)}</span>, size: 120, minSize: 100, maxSize: 140 },
    { accessorKey: 'clientName', header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />, cell: ({ row }) => <span className='text-sm'>{row.original.clientName || row.original.clientId}</span>, size: 180, minSize: 150, maxSize: 250 },
    { accessorKey: 'totalAmount', header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />, cell: ({ row }) => <span className='text-right font-mono text-sm font-medium'>${row.original.totalAmount.toFixed(2)}</span>, size: 120, minSize: 100, maxSize: 140 },
    { accessorKey: 'periodStart', header: ({ column }) => <DataTableColumnHeader column={column} title='Period' />, cell: ({ row }) => <span className='text-xs text-muted-foreground'>{new Date(row.original.periodStart).toLocaleDateString()} – {new Date(row.original.periodEnd).toLocaleDateString()}</span>, size: 170, minSize: 150, maxSize: 200 },
    { accessorKey: 'dueDate', header: ({ column }) => <DataTableColumnHeader column={column} title='Due' />, cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString() : '—'}</span>, size: 110, minSize: 90, maxSize: 140 },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />, cell: ({ row }) => { const cls = STATUS_BADGE[row.original.status] || ''; return <Badge variant='outline' className={`${cls} capitalize`}>{row.original.status}</Badge> }, size: 110, minSize: 90, maxSize: 130 },
    { id: 'actions', header: '', cell: ({ row }) => <div className='text-right'><Button variant='ghost' size='icon' onClick={() => setDetailId(row.original.id)}><Eye className='h-4 w-4' /></Button></div>, size: 60, minSize: 50, maxSize: 80 },
  ], [])

  const table = useReactTable({ data: invoices, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-2xl font-bold tracking-tight'>Invoices</h1><p className='text-muted-foreground'>Client invoices for storage charges</p></div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={() => setGenerateOpen(true)}><FileText className='mr-2 h-4 w-4' />Generate Invoice</Button>
        </div>
      </div>
      <Card>
        <CardHeader className='pb-3'><CardTitle className='flex items-center gap-2 text-base'><FileText className='h-4 w-4' />All Invoices</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'><Label>Client ID</Label><Input placeholder='Filter by client' value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} /></div>
            <div className='grid gap-2'><Label>Status</Label><Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger><SelectValue placeholder='All Statuses' /></SelectTrigger><SelectContent><SelectItem value='all'>All</SelectItem><SelectItem value='DRAFT'>Draft</SelectItem><SelectItem value='SENT'>Sent</SelectItem><SelectItem value='PAID'>Paid</SelectItem><SelectItem value='OVERDUE'>Overdue</SelectItem><SelectItem value='CANCELLED'>Cancelled</SelectItem></SelectContent></Select></div>
          </div>
          {isLoading ? <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          : isError ? <div className='flex flex-col items-center gap-4 py-12 text-center'><AlertCircle className='h-10 w-10 text-muted-foreground' /><div><p className='font-medium text-destructive'>Failed to load invoices</p><p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p></div><Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button></div>
          : invoices.length === 0 ? <div className='flex flex-col items-center gap-4 py-12 text-center'><FileText className='h-10 w-10 text-muted-foreground/40' /><div><p className='font-medium'>No Invoices</p><p className='text-sm text-muted-foreground'>Generate an invoice from charges</p></div></div>
          : <div className='rounded-md border'><Table><TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <InvoiceGenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      {detailId && <InvoiceDetailDialog invoiceId={detailId} open={!!detailId} onOpenChange={(open) => { if (!open) setDetailId(null) }} />}
    </div>
  )
}
