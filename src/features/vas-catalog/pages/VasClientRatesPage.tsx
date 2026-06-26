import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw, Plus, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useVasClientRateList,
  type VasClientRate,
} from '@/features/vas-catalog/data/vas-catalog-queries'
import { ClientRateDialog } from '@/features/vas-catalog/components/ClientRateDialog'

export function VasClientRatesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [clientFilter, setClientFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useVasClientRateList({
    clientId: clientFilter || undefined,
  })

  const rates: VasClientRate[] = data?.rates || []

  const columns: ColumnDef<VasClientRate, any>[] = useMemo(
    () => [
      {
        accessorKey: 'serviceName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Service' />,
        cell: ({ row }) => <span className='text-sm font-medium'>{row.original.serviceName || row.original.serviceId.substring(0, 12)}</span>,
      },
      {
        accessorKey: 'clientName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.clientName || row.original.clientId}</span>,
      },
      {
        accessorKey: 'ratePerUnit',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Rate/Unit' />,
        cell: ({ row }) => (
          <span className='font-mono text-sm font-medium'>{row.original.currency || '$'}{row.original.ratePerUnit.toFixed(2)}</span>
        ),
      },
      {
        accessorKey: 'minCharge',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Min Charge' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>
            {row.original.minCharge != null ? `$${row.original.minCharge.toFixed(2)}` : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'effectiveDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Effective' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.effectiveDate ? new Date(row.original.effectiveDate).toLocaleDateString() : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Expires' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString() : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'} className='text-xs'>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: rates,
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
          <h1 className='text-2xl font-bold tracking-tight'>VAS Client Rates</h1>
          <p className='text-muted-foreground'>Client-specific pricing for VAS services</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Set Rate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <DollarSign className='h-4 w-4' />
            Client Rates
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Client ID</Label>
              <Input placeholder='Filter by client ID' value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} />
            </div>
          </div>

          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium text-destructive'>Failed to load client rates</p>
                <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : rates.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <DollarSign className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Rates</p>
                <p className='text-sm text-muted-foreground'>No client rates match the current filters</p>
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
        </CardContent>
      </Card>

      <ClientRateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultClientId={clientFilter || undefined}
      />
    </div>
  )
}
