import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw, Plus, Wrench, Eye, AlertCircle } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useVasServiceList,
  type VasService,
} from '@/features/vas-catalog/data/vas-catalog-queries'
import { ServiceDialog } from '@/features/vas-catalog/components/ServiceDialog'

const CATEGORY_BADGE: Record<string, string> = {
  KITTING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LABELING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  PACKAGING: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  ASSEMBLY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  INSPECTION: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  REPACK: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export function VasServicesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editService, setEditService] = useState<VasService | undefined>(undefined)

  const { data, isLoading, isError, error, refetch, isFetching } = useVasServiceList({
    category: categoryFilter || undefined,
  })

  const services: VasService[] = data?.services || []

  const columns: ColumnDef<VasService, any>[] = useMemo(
    () => [
      {
        accessorKey: 'serviceCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.serviceCode}</span>,
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'serviceName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        cell: ({ row }) => <span className='text-sm font-medium'>{row.original.serviceName}</span>,
        size: 200,
        minSize: 160,
        maxSize: 280,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
        cell: ({ row }) => {
          const cls = CATEGORY_BADGE[row.original.category] || ''
          return <Badge variant='outline' className={cls}>{row.original.category || '—'}</Badge>
        },
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'defaultRate',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Default Rate' />,
        cell: ({ row }) => (
          <span className='text-right font-mono text-xs'>{row.original.defaultRate != null ? `$${row.original.defaultRate.toFixed(2)}` : '—'}</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='UOM' />,
        cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.uomId || '—'}</span>,
        size: 80,
        minSize: 70,
        maxSize: 110,
      },
      {
        accessorKey: 'estimatedTimeMinutes',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Est. Time' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>{row.original.estimatedTimeMinutes != null ? `${row.original.estimatedTimeMinutes} min` : '—'}</span>
        ),
        size: 110,
        minSize: 90,
        maxSize: 140,
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'} className='text-xs'>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
        size: 90,
        minSize: 70,
        maxSize: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='text-right'>
            <Button variant='ghost' size='icon' onClick={() => { setEditService(row.original); setCreateOpen(true) }}>
              <Eye className='h-4 w-4' />
            </Button>
          </div>
        ),
        size: 60,
        minSize: 50,
        maxSize: 80,
      },
    ],
    []
  )

  const table = useReactTable({
    data: services,
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
          <h1 className='text-2xl font-bold tracking-tight'>VAS Services</h1>
          <p className='text-muted-foreground'>Service catalog for value-added services</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { setEditService(undefined); setCreateOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' />
            New Service
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Wrench className='h-4 w-4' />
            All Services
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='KITTING'>Kitting</SelectItem>
                  <SelectItem value='LABELING'>Labeling</SelectItem>
                  <SelectItem value='PACKAGING'>Packaging</SelectItem>
                  <SelectItem value='ASSEMBLY'>Assembly</SelectItem>
                  <SelectItem value='INSPECTION'>Inspection</SelectItem>
                  <SelectItem value='REPACK'>Repack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium text-destructive'>Failed to load services</p>
                <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : services.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <Wrench className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Services</p>
                <p className='text-sm text-muted-foreground'>No VAS services match the current filters</p>
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

      <ServiceDialog
        open={createOpen}
        onOpenChange={(open) => { if (!open) setEditService(undefined); setCreateOpen(open) }}
        editService={editService}
      />
    </div>
  )
}
