import { useState, useMemo } from 'react'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { RefreshCw, Plus, Repeat, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useBillingCycleList, type BillingCycle } from '@/features/billing/data/billing-queries'
import { CycleDialog } from '@/features/billing/components/CycleDialog'

const FREQ_BADGE: Record<string, string> = {
  WEEKLY: 'bg-blue-100 text-blue-700', MONTHLY: 'bg-green-100 text-green-700', QUARTERLY: 'bg-amber-100 text-amber-700',
}

export function BillingCyclesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useBillingCycleList({})
  const cycles: BillingCycle[] = data?.cycles || []

  const columns: ColumnDef<BillingCycle, any>[] = useMemo(() => [
    { accessorKey: 'cycleCode', header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />, cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.cycleCode}</span>, size: 120, minSize: 100, maxSize: 140 },
    { accessorKey: 'cycleName', header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />, cell: ({ row }) => <span className='text-sm font-medium'>{row.original.cycleName}</span>, size: 200, minSize: 160, maxSize: 280 },
    { accessorKey: 'frequency', header: ({ column }) => <DataTableColumnHeader column={column} title='Frequency' />, cell: ({ row }) => { const cls = FREQ_BADGE[row.original.frequency] || ''; return <Badge variant='outline' className={cls}>{row.original.frequency}</Badge> }, size: 120, minSize: 100, maxSize: 140 },
    { accessorKey: 'billingDay', header: ({ column }) => <DataTableColumnHeader column={column} title='Billing Day' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>{row.original.billingDay}</span>, size: 100, minSize: 80, maxSize: 130 },
    { accessorKey: 'facilityId', header: ({ column }) => <DataTableColumnHeader column={column} title='Facility' />, cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.facilityId}</span>, size: 120, minSize: 100, maxSize: 160 },
    { accessorKey: 'isActive', header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />, cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'secondary'} className='text-xs'>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>, size: 90, minSize: 70, maxSize: 120 },
  ], [])

  const table = useReactTable({ data: cycles, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-2xl font-bold tracking-tight'>Billing Cycles</h1><p className='text-muted-foreground'>Billing cycle definitions</p></div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />New Cycle</Button>
        </div>
      </div>
      <Card>
        <CardHeader className='pb-3'><CardTitle className='flex items-center gap-2 text-base'><Repeat className='h-4 w-4' />All Cycles</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          : isError ? <div className='flex flex-col items-center gap-4 py-12 text-center'><AlertCircle className='h-10 w-10 text-muted-foreground' /><div><p className='font-medium text-destructive'>Failed to load cycles</p><p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p></div><Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button></div>
          : cycles.length === 0 ? <div className='flex flex-col items-center gap-4 py-12 text-center'><Repeat className='h-10 w-10 text-muted-foreground/40' /><div><p className='font-medium'>No Cycles</p><p className='text-sm text-muted-foreground'>No billing cycles found</p></div></div>
          : <div className='rounded-md border'><Table><TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <CycleDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
