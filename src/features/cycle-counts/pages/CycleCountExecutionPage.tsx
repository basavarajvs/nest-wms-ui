import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw, ClipboardCheck, Play, Eye, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import {
  useCycleCounts,
  type CycleCount,
} from '@/features/cycle-counts/data/cycle-count-queries'
import { useFacility } from '@/hooks/useFacility'
import { CycleCountTaskDetail } from '@/features/cycle-counts/components/CycleCountTaskDetail'

const EXECUTION_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'VARIANCE', label: 'Variance' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const COUNT_METHOD_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'BLIND', label: 'Blind' },
  { value: 'KNOWN', label: 'Known' },
]

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  PENDING: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  VARIANCE: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

export function CycleCountExecutionPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [assignedUserFilter, setAssignedUserFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [executingCount, setExecutingCount] = useState<CycleCount | null>(null)

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = useCycleCounts({
    page,
    limit,
    status: statusFilter,
    facilityId: selectedFacility?.id,
  })

  const counts: CycleCount[] = data?.counts || []
  const total = data?.total ?? counts.length

  const filtered = useMemo(() => {
    return counts.filter((c) => {
      if (methodFilter && c.countMethod?.toUpperCase() !== methodFilter) return false
      if (assignedUserFilter) {
        const userId = (c.assignedUserId || '').toLowerCase()
        if (!userId.includes(assignedUserFilter.toLowerCase())) return false
      }
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        (c.countNumber || '').toLowerCase().includes(term) ||
        (c.id || '').toLowerCase().includes(term) ||
        (c.scopeIdentifier || '').toLowerCase().includes(term)
      )
    })
  }, [counts, methodFilter, searchTerm])

  const handleFilterReset = () => {
    setStatusFilter('')
    setMethodFilter('')
    setAssignedUserFilter('')
    setSearchTerm('')
    setPage(1)
  }

  const columns: ColumnDef<CycleCount, any>[] = useMemo(
    () => [
      {
        accessorKey: 'countNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Count #' />,
        cell: ({ row }) => (
          <span className='font-mono text-sm font-medium'>
            {row.original.countNumber || row.original.id.substring(0, 12) + '...'}
          </span>
        ),
      },
      {
        accessorKey: 'countMethod',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Method' />,
        cell: ({ row }) => (
          <Badge variant='outline'>{row.original.countMethod || '—'}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => (
          <Badge
            variant='outline'
            className={`${STATUS_STYLES[row.original.status || ''] || ''} capitalize`}
          >
            {row.original.status ? row.original.status.replace(/_/g, ' ') : '—'}
          </Badge>
        ),
      },
      {
        accessorKey: 'scopeType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scope' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.scopeType || '—'}
            {row.original.scopeIdentifier ? ` (${row.original.scopeIdentifier})` : ''}
          </span>
        ),
      },
      {
        accessorKey: 'totalItems',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Progress' />,
        cell: ({ row }) => {
          const c = row.original
          if (c.totalItems == null) return <span className='text-xs text-muted-foreground'>—</span>
          const pct = c.totalItems > 0 ? Math.min(100, ((c.countedItems || 0) / c.totalItems) * 100) : 0
          return (
            <div className='flex items-center gap-2'>
              <div className='h-2 w-20 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className='text-xs text-muted-foreground'>
                {c.countedItems || 0}/{c.totalItems}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'assignedUserId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Assigned To' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.assignedUserId || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'scheduledAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Scheduled' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {row.original.scheduledAt
              ? new Date(row.original.scheduledAt).toLocaleDateString()
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const c = row.original
          const canStart = c.status === 'SCHEDULED' || c.status === 'PENDING' || c.status === 'IN_PROGRESS'
          return (
            <div className='text-right'>
              <Button
                variant={canStart ? 'default' : 'outline'}
                size='sm'
                className='h-7 text-xs'
                onClick={() => setExecutingCount(c)}
              >
                {canStart ? (
                  <>
                    <Play className='mr-1 h-3 w-3' />
                    {c.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                  </>
                ) : (
                  <>
                    <Eye className='mr-1 h-3 w-3' />
                    View
                  </>
                )}
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: filtered,
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
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <ClipboardCheck className='h-6 w-6' />
            Cycle Count Execution
          </h1>
          <p className='text-muted-foreground'>
            Perform and manage inventory cycle counts
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Search className='h-4 w-4' />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-6'>
            <div className='grid gap-2'>
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  {EXECUTION_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Count Method</Label>
              <Select
                value={methodFilter}
                onValueChange={(v) => { setMethodFilter(v); setPage(1) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Methods' />
                </SelectTrigger>
                <SelectContent>
                  {COUNT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Assigned User</Label>
              <Input
                value={assignedUserFilter}
                onChange={(e) => { setAssignedUserFilter(e.target.value); setPage(1) }}
                placeholder='User ID...'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Search</Label>
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                placeholder='Count number, ID, or scope...'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Facility</Label>
              <div className='flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground'>
                {selectedFacility
                  ? `${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
                  : 'Select a facility'}
              </div>
            </div>
            <div className='flex items-end'>
              <Button variant='outline' onClick={handleFilterReset} className='w-full'>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counts Table */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Counts ({total})</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load cycle counts</p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <div className='rounded-full bg-muted p-4'>
                <ClipboardCheck className='h-8 w-8 text-muted-foreground/50' />
              </div>
              <p className='font-medium text-muted-foreground'>No cycle counts found</p>
              <p className='max-w-md text-sm text-muted-foreground'>
                {statusFilter || methodFilter || assignedUserFilter || searchTerm
                  ? 'No counts match the current filters.'
                  : 'Schedule a cycle count from the Cycle Counts page to get started.'}
              </p>
              {(statusFilter || methodFilter || assignedUserFilter || searchTerm) && (
                <Button variant='outline' size='sm' onClick={handleFilterReset}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
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
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      {executingCount && (
        <CycleCountTaskDetail
          count={executingCount}
          open={!!executingCount}
          onOpenChange={(open) => { if (!open) setExecutingCount(null) }}
          onComplete={() => refetch()}
        />
      )}
    </div>
  )
}
