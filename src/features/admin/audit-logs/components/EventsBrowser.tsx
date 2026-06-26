import { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search as SearchBar } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  useEventList,
  type WarehouseEvent,
} from '../data/audit-log-queries'
import { EventDetailDialog } from './EventDetailDialog'

const EVENT_TYPE_OPTIONS = [
  'CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGE', 'ASSIGNED',
  'COMPLETED', 'CANCELLED', 'VALIDATED', 'VERIFIED', 'ERROR',
]

const ENTITY_TYPE_OPTIONS = [
  'RECEIPT', 'PUTAWAY', 'PICK', 'PACK', 'SHIPMENT',
  'INVENTORY', 'TRANSFER', 'CYCLE_COUNT', 'ADJUSTMENT',
  'ORDER', 'WORK_ORDER', 'QUALITY',
]

const SOURCE_OPTIONS = ['WEB', 'RF', 'INTEGRATION', 'SYSTEM']

function SourceBadge({ source }: { source: string }) {
  const s = (source || '').toUpperCase()
  const cls =
    s === 'WEB' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    : s === 'RF' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    : s === 'INTEGRATION' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    : s === 'SYSTEM' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    : ''
  return (
    <Badge className={cls} variant='outline'>{s || 'UNKNOWN'}</Badge>
  )
}

export function EventsBrowser() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const params = {
    eventType: eventTypeFilter || undefined,
    entityType: entityTypeFilter || undefined,
    source: sourceFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { data, isLoading, error, refetch } = useEventList(params)

  const events = data?.events ?? []

  const columns: ColumnDef<WarehouseEvent>[] = useMemo(
    () => [
      {
        accessorKey: 'eventType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Event Type' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('eventType') as string
          return (
            <Badge variant='outline' className='font-mono'>
              {val ?? '-'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'entityType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Entity' />
        ),
        cell: ({ row }) => row.getValue('entityType') ?? '-',
      },
      {
        accessorKey: 'entityId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Entity ID' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('entityId') as string | undefined
          return (
            <span className='max-w-28 truncate font-mono text-xs block'>
              {val ?? '-'}
            </span>
          )
        },
      },
      {
        accessorKey: 'source',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Source' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('source') as string
          return <SourceBadge source={val} />
        },
      },
      {
        accessorKey: 'performedBy',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Performed By' />
        ),
        cell: ({ row }) => row.getValue('performedBy') ?? '-',
      },
      {
        accessorKey: 'occurredAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Occurred At' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('occurredAt') as string | undefined
          return (
            <span className='whitespace-nowrap font-mono text-xs'>
              {val ? new Date(val).toLocaleString() : '-'}
            </span>
          )
        },
      },
    ],
    []
  )

  const openDetail = useCallback((event: WarehouseEvent) => {
    setSelectedEventId(event.id)
    setDetailOpen(true)
  }, [])

  const table = useReactTable({
    data: events,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success('Events refreshed')
  }, [refetch])

  const clearFilters = () => {
    setEventTypeFilter('')
    setEntityTypeFilter('')
    setSourceFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const hasFilters = eventTypeFilter || entityTypeFilter || sourceFilter || dateFrom || dateTo

  return (
    <>
      <Header>
        <SearchBar />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Events</h1>
              <p className='text-muted-foreground'>
                Browse warehouse events across all sources (WEB, RF, Integration, System)
              </p>
            </div>
            <Button variant='outline' size='sm' onClick={handleRefresh}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex flex-wrap items-end gap-4'>
                <div>
                  <Label>Event Type</Label>
                  <Select
                    value={eventTypeFilter || 'all'}
                    onValueChange={(v) => { setEventTypeFilter(v === 'all' ? '' : v); setPage(1) }}
                  >
                    <SelectTrigger className='w-44'>
                      <SelectValue placeholder='All types' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      {EVENT_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Entity Type</Label>
                  <Select
                    value={entityTypeFilter || 'all'}
                    onValueChange={(v) => { setEntityTypeFilter(v === 'all' ? '' : v); setPage(1) }}
                  >
                    <SelectTrigger className='w-44'>
                      <SelectValue placeholder='All entities' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Entities</SelectItem>
                      {ENTITY_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select
                    value={sourceFilter || 'all'}
                    onValueChange={(v) => { setSourceFilter(v === 'all' ? '' : v); setPage(1) }}
                  >
                    <SelectTrigger className='w-36'>
                      <SelectValue placeholder='All sources' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Sources</SelectItem>
                      {SOURCE_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date From</Label>
                  <Input
                    type='date'
                    className='w-40'
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                  />
                </div>
                <div>
                  <Label>Date To</Label>
                  <Input
                    type='date'
                    className='w-40'
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                  />
                </div>
                {hasFilters && (
                  <Button variant='ghost' size='sm' onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Log ({data?.total ?? events.length})</CardTitle>
              <CardDescription>
                Warehouse events sorted by most recent first
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className='h-8 w-full' />
                  ))}
                </div>
              ) : error ? (
                <div className='py-8 text-center text-destructive'>
                  Failed to load events.
                </div>
              ) : events.length === 0 ? (
                <div className='py-8 text-center text-muted-foreground'>
                  {hasFilters
                    ? 'No events match the current filters.'
                    : 'No events recorded yet.'}
                </div>
              ) : (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className='cursor-pointer'
                          onClick={() => openDetail(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <DataTablePagination table={table} className='mt-4' />
            </CardContent>
          </Card>
        </div>
      </Main>

      <EventDetailDialog
        eventId={selectedEventId}
        open={detailOpen}
        onOpenChange={(o) => {
          setDetailOpen(o)
          if (!o) setSelectedEventId(null)
        }}
      />
    </>
  )
}
