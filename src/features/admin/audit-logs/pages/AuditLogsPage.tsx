import { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Download, RefreshCw } from 'lucide-react'
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
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search as SearchBar } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import {
  useAuditLogs,
  useAuditSummary,
  useExportAuditLogs,
  type AuditLog,
} from '../data/audit-log-queries'

const eventTypeOptions = [
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Logout', value: 'LOGOUT' },
  { label: 'Export', value: 'EXPORT' },
  { label: 'Import', value: 'IMPORT' },
]

const resourceTypeOptions = [
  { label: 'User', value: 'USER' },
  { label: 'Role', value: 'ROLE' },
  { label: 'Order', value: 'ORDER' },
  { label: 'Shipment', value: 'SHIPMENT' },
  { label: 'Inventory', value: 'INVENTORY' },
  { label: 'Product', value: 'PRODUCT' },
  { label: 'Warehouse', value: 'WAREHOUSE' },
  { label: 'Tenant', value: 'TENANT' },
]

export function AuditLogsPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const { data, isLoading, error, refetch } = useAuditLogs()
  const { data: summary } = useAuditSummary()
  const exportMutation = useExportAuditLogs()

  const logs = data?.logs ?? []

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Timestamp' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('createdAt') as string | undefined
          return (
            <span className='whitespace-nowrap font-mono text-xs'>
              {val ? new Date(val).toLocaleString() : '-'}
            </span>
          )
        },
      },
      {
        accessorKey: 'userEmail',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='User' />
        ),
        cell: ({ row }) => {
          const email = row.getValue('userEmail') as string | undefined
          const userId = row.original.userId
          return (
            <span className='max-w-36 truncate block'>
              {email ?? userId ?? '-'}
            </span>
          )
        },
      },
      {
        accessorKey: 'eventType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Event' />
        ),
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => {
          const val = row.getValue('eventType') as string | undefined
          return (
            <Badge
              variant={
                val === 'DELETE'
                  ? 'destructive'
                  : val === 'CREATE'
                    ? 'default'
                    : val === 'UPDATE'
                      ? 'secondary'
                      : 'outline'
              }
            >
              {val ?? 'UNKNOWN'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'resourceType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Resource' />
        ),
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => {
          return row.getValue('resourceType') ?? '-'
        },
      },
      {
        accessorKey: 'resourceId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Resource ID' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('resourceId') as string | undefined
          return (
            <span className='max-w-28 truncate font-mono text-xs block'>
              {val ?? '-'}
            </span>
          )
        },
      },
      {
        id: 'details',
        accessorFn: (row) => row.details,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Details' />
        ),
        cell: ({ row }) => {
          const val = row.getValue('details') as string | undefined
          return (
            <span className='max-w-64 truncate block'>{val ?? '-'}</span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: logs,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  })

  const handleExport = useCallback(async () => {
    try {
      await exportMutation.mutateAsync(undefined)
      toast.success('Audit log export initiated')
    } catch {
      toast.error('Failed to export audit logs')
    }
  }, [exportMutation])

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
              <h1 className='text-2xl font-bold tracking-tight'>
                Audit Logs
              </h1>
              <p className='text-muted-foreground'>
                Track all system activities and changes
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetch()}
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                <Download className='mr-2 h-4 w-4' />
                Export
              </Button>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {summary?.totalLogs ?? '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>
                {logs.length} entries
                {data?.total !== undefined && data.total !== logs.length
                  ? ` (${data.total} total)`
                  : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-4'>
                <DataTableToolbar
                  table={table}
                  searchPlaceholder='Search by user, resource ID, or details...'
                  filters={[
                    {
                      columnId: 'eventType',
                      title: 'Event type',
                      options: eventTypeOptions,
                    },
                    {
                      columnId: 'resourceType',
                      title: 'Resource type',
                      options: resourceTypeOptions,
                    },
                  ]}
                />
              </div>

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
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: columns.length }).map(
                            (_, j) => (
                              <TableCell key={j}>
                                <Skeleton className='h-4 w-full' />
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className='py-8 text-center text-muted-foreground'
                        >
                          Failed to load audit logs. Check your connection and
                          try again.
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className='py-8 text-center text-muted-foreground'
                        >
                          No audit log entries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataTablePagination table={table} className='mt-4' />
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
