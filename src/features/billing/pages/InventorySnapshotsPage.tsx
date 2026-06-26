import { useState, useMemo } from 'react'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { RefreshCw, Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useSnapshotList, type StorageSnapshot } from '@/features/billing/data/billing-queries'
import { SnapshotGenerateDialog } from '@/features/billing/components/SnapshotGenerateDialog'

export function InventorySnapshotsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [clientFilter, setClientFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useSnapshotList({ clientId: clientFilter || undefined })
  const snapshots: StorageSnapshot[] = data?.snapshots || []

  const columns: ColumnDef<StorageSnapshot, any>[] = useMemo(() => [
    { accessorKey: 'snapshotDate', header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />, cell: ({ row }) => <span className='text-sm'>{new Date(row.original.snapshotDate).toLocaleDateString()}</span>, size: 110, minSize: 90, maxSize: 140 },
    { accessorKey: 'clientName', header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />, cell: ({ row }) => <span className='text-sm'>{row.original.clientName || row.original.clientId}</span>, size: 180, minSize: 150, maxSize: 250 },
    { accessorKey: 'totalPallets', header: ({ column }) => <DataTableColumnHeader column={column} title='Pallets' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>{row.original.totalPallets ?? '—'}</span>, size: 90, minSize: 70, maxSize: 120 },
    { accessorKey: 'totalSqft', header: ({ column }) => <DataTableColumnHeader column={column} title='Sq Ft' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>{row.original.totalSqft ?? '—'}</span>, size: 90, minSize: 70, maxSize: 120 },
    { accessorKey: 'totalCubicFt', header: ({ column }) => <DataTableColumnHeader column={column} title='Cu Ft' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>{row.original.totalCubicFt ?? '—'}</span>, size: 90, minSize: 70, maxSize: 120 },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />, cell: ({ row }) => <Badge variant='outline'>{row.original.status}</Badge>, size: 100, minSize: 80, maxSize: 130 },
  ], [])

  const table = useReactTable({ data: snapshots, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-2xl font-bold tracking-tight'>Inventory Snapshots</h1><p className='text-muted-foreground'>Daily inventory snapshots for billing</p></div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={() => setDialogOpen(true)}><Camera className='mr-2 h-4 w-4' />Generate Snapshot</Button>
        </div>
      </div>
      <Card>
        <CardHeader className='pb-3'><CardTitle className='flex items-center gap-2 text-base'><Camera className='h-4 w-4' />Snapshots</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'><Label>Client ID</Label><Input placeholder='Filter by client' value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} /></div>
          </div>
          {isLoading ? <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          : isError ? <div className='flex flex-col items-center gap-4 py-12 text-center'><AlertCircle className='h-10 w-10 text-muted-foreground' /><div><p className='font-medium text-destructive'>Failed to load snapshots</p><p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p></div><Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button></div>
          : snapshots.length === 0 ? <div className='flex flex-col items-center gap-4 py-12 text-center'><Camera className='h-10 w-10 text-muted-foreground/40' /><div><p className='font-medium'>No Snapshots</p><p className='text-sm text-muted-foreground'>Generate a snapshot to begin</p></div></div>
          : <div className='rounded-md border'><Table><TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <SnapshotGenerateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
