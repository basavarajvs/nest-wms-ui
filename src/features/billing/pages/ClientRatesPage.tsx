import { useState, useMemo } from 'react'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { RefreshCw, Plus, Users, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useRateList, type StorageRate } from '@/features/billing/data/billing-queries'
import { ClientRateDialog } from '@/features/billing/components/ClientRateDialog'

export function ClientRatesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useRateList({})
  const rates: StorageRate[] = data?.rates || []

  const columns: ColumnDef<StorageRate, any>[] = useMemo(() => [
    { accessorKey: 'rateCode', header: ({ column }) => <DataTableColumnHeader column={column} title='Rate Code' />, cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.rateCode}</span>, size: 120, minSize: 100, maxSize: 140 },
    { accessorKey: 'rateName', header: ({ column }) => <DataTableColumnHeader column={column} title='Rate Name' />, cell: ({ row }) => <span className='text-sm'>{row.original.rateName}</span>, size: 200, minSize: 160, maxSize: 280 },
    { accessorKey: 'defaultRate', header: ({ column }) => <DataTableColumnHeader column={column} title='Default Rate' />, cell: ({ row }) => <span className='text-right font-mono text-xs'>${row.original.defaultRate.toFixed(2)}</span>, size: 110, minSize: 90, maxSize: 140 },
    { accessorKey: 'rateType', header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />, cell: ({ row }) => <span className='text-xs capitalize'>{row.original.rateType?.replace(/_/g, ' ')}</span>, size: 100, minSize: 80, maxSize: 130 },
    { accessorKey: 'isActive', header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />, cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'secondary'} className='text-xs'>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>, size: 90, minSize: 70, maxSize: 120 },
  ], [])

  const table = useReactTable({ data: rates, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div><h1 className='text-2xl font-bold tracking-tight'>Client Rates</h1><p className='text-muted-foreground'>Assign negotiated storage rates to clients</p></div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className='mr-2 h-4 w-4' />Set Rate</Button>
        </div>
      </div>
      <Card>
        <CardHeader className='pb-3'><CardTitle className='flex items-center gap-2 text-base'><Users className='h-4 w-4' />Rate Master (select a rate to assign)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          : isError ? <div className='flex flex-col items-center gap-4 py-12 text-center'><AlertCircle className='h-10 w-10 text-muted-foreground' /><div><p className='font-medium text-destructive'>Failed to load rates</p><p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p></div><Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button></div>
          : rates.length === 0 ? <div className='flex flex-col items-center gap-4 py-12 text-center'><Users className='h-10 w-10 text-muted-foreground/40' /><div><p className='font-medium'>No Rates</p><p className='text-sm text-muted-foreground'>Create rates in Rate Master first</p></div></div>
          : <div className='rounded-md border'><Table><TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
        </CardContent>
      </Card>
      <ClientRateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
