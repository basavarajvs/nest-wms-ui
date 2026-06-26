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
  RefreshCw,
  Plus,
  Beaker,
  Eye,
  AlertCircle,
} from 'lucide-react'
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
  useInspectionList,
  type Inspection,
} from '@/features/quality/inspections/data/inspection-queries'
import { InspectionDialog } from '@/features/quality/inspections/components/InspectionDialog'
import { InspectionDetailDialog } from '@/features/quality/inspections/components/InspectionDetailDialog'
import { useFacility } from '@/hooks/useFacility'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PASSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONDITIONAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function InspectionListPage() {
  const { selectedFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useInspectionList({
    status: statusFilter || undefined,
    inspectionType: typeFilter || undefined,
    facilityId: selectedFacility?.id || undefined,
  })

  const inspections: Inspection[] = data?.inspections || []

  const columns: ColumnDef<Inspection, any>[] = useMemo(
    () => [
      {
        accessorKey: 'inspectionNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Inspection' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs font-medium'>{row.original.inspectionNumber || row.original.id.substring(0, 12)}</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'inspectionType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        cell: ({ row }) => (
          <span className='text-xs capitalize'>{row.original.inspectionType?.replace(/_/g, ' ') || '—'}</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
          const cls = STATUS_BADGE[row.original.status] || ''
          return (
            <Badge variant='outline' className={`${cls} capitalize`}>
              {row.original.status?.replace(/_/g, ' ') || '—'}
            </Badge>
          )
        },
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
        cell: ({ row }) => {
          const cls = PRIORITY_BADGE[row.original.priority] || ''
          return <Badge variant='outline' className={cls}>{row.original.priority || '—'}</Badge>
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <span className='text-sm'>{row.original.productName || row.original.productId || '—'}</span>
        ),
        size: 180,
        minSize: 150,
        maxSize: 250,
      },
      {
        accessorKey: 'assignedToName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Assigned To' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>{row.original.assignedToName || row.original.assignedToUserId || '—'}</span>
        ),
        size: 150,
        minSize: 120,
        maxSize: 200,
      },
      {
        accessorKey: 'scheduledDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scheduled' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.scheduledDate ? new Date(row.original.scheduledDate).toLocaleDateString() : '—'}
          </span>
        ),
        size: 110,
        minSize: 90,
        maxSize: 140,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='text-right'>
            <Button variant='ghost' size='icon' onClick={() => setDetailId(row.original.id)}>
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
    data: inspections,
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
          <h1 className='text-2xl font-bold tracking-tight'>Inspections</h1>
          <p className='text-muted-foreground'>Quality inspections and results</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Inspection
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Beaker className='h-4 w-4' />
            All Inspections
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='PENDING'>Pending</SelectItem>
                  <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                  <SelectItem value='PASSED'>Passed</SelectItem>
                  <SelectItem value='FAILED'>Failed</SelectItem>
                  <SelectItem value='CONDITIONAL'>Conditional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='RECEIVING'>Receiving</SelectItem>
                  <SelectItem value='PICKING'>Picking</SelectItem>
                  <SelectItem value='RETURN'>Return</SelectItem>
                  <SelectItem value='ROUTINE'>Routine</SelectItem>
                  <SelectItem value='COMPLIANCE'>Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder='All Priorities' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
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
                <p className='font-medium text-destructive'>Failed to load inspections</p>
                <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : inspections.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <Beaker className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Inspections</p>
                <p className='text-sm text-muted-foreground'>No inspections match the current filters</p>
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

      <InspectionDialog open={createOpen} onOpenChange={setCreateOpen} />
      {detailId && (
        <InspectionDetailDialog
          inspectionId={detailId}
          open={!!detailId}
          onOpenChange={(open) => { if (!open) setDetailId(null) }}
        />
      )}
    </div>
  )
}
