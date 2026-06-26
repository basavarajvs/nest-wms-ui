import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw, Plus, Monitor, Eye, AlertCircle } from 'lucide-react'
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
  useVasWorkstationList,
  type VasWorkstation,
} from '@/features/vas-catalog/data/vas-catalog-queries'
import { WorkstationDialog } from '@/features/vas-catalog/components/WorkstationDialog'

const STATION_TYPE_BADGE: Record<string, string> = {
  KITTING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LABELING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ASSEMBLY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PACKING: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export function VasWorkstationsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [stationTypeFilter, setStationTypeFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editWorkstation, setEditWorkstation] = useState<VasWorkstation | undefined>(undefined)

  const { data, isLoading, isError, error, refetch, isFetching } = useVasWorkstationList({
    stationType: stationTypeFilter || undefined,
  })

  const workstations: VasWorkstation[] = data?.workstations || []

  const columns: ColumnDef<VasWorkstation, any>[] = useMemo(
    () => [
      {
        accessorKey: 'workstationCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.workstationCode}</span>,
      },
      {
        accessorKey: 'workstationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Name' />,
        cell: ({ row }) => <span className='text-sm font-medium'>{row.original.workstationName}</span>,
      },
      {
        accessorKey: 'stationType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        cell: ({ row }) => {
          const cls = STATION_TYPE_BADGE[row.original.stationType] || ''
          return <Badge variant='outline' className={cls}>{row.original.stationType || '—'}</Badge>
        },
      },
      {
        accessorKey: 'locationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Location' />,
        cell: ({ row }) => <span className='text-xs text-muted-foreground'>{row.original.locationName || row.original.locationId || '—'}</span>,
      },
      {
        accessorKey: 'isAvailable',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Available' />,
        cell: ({ row }) => (
          <Badge variant={row.original.isAvailable ? 'outline' : 'secondary'} className='text-xs'>
            {row.original.isAvailable ? 'Available' : 'Occupied'}
          </Badge>
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='text-right'>
            <Button variant='ghost' size='icon' onClick={() => { setEditWorkstation(row.original); setCreateOpen(true) }}>
              <Eye className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: workstations,
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
          <h1 className='text-2xl font-bold tracking-tight'>VAS Workstations</h1>
          <p className='text-muted-foreground'>Workstations for value-added service execution</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { setEditWorkstation(undefined); setCreateOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' />
            New Workstation
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Monitor className='h-4 w-4' />
            All Workstations
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Station Type</Label>
              <Select value={stationTypeFilter} onValueChange={(v) => setStationTypeFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='KITTING'>Kitting</SelectItem>
                  <SelectItem value='LABELING'>Labeling</SelectItem>
                  <SelectItem value='ASSEMBLY'>Assembly</SelectItem>
                  <SelectItem value='PACKING'>Packing</SelectItem>
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
                <p className='font-medium text-destructive'>Failed to load workstations</p>
                <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : workstations.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <Monitor className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Workstations</p>
                <p className='text-sm text-muted-foreground'>No VAS workstations match the current filters</p>
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

      <WorkstationDialog
        open={createOpen}
        onOpenChange={(open) => { if (!open) setEditWorkstation(undefined); setCreateOpen(open) }}
        editWorkstation={editWorkstation}
      />
    </div>
  )
}
