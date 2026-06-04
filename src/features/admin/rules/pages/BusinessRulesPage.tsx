import { useState, useMemo } from 'react'
import type {
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { Plus, RefreshCw, Eye, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { useRules, type WmsRule } from '../data/rule-queries'
import { RuleDialog } from '../components/RuleDialog'
import { RuleDetailDialog } from '../components/RuleDetailDialog'

export function BusinessRulesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<WmsRule | null>(null)
  const [detailKey, setDetailKey] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useRules()

  const items = data?.rules ?? []

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  const columns: ColumnDef<WmsRule, any>[] = useMemo(
    () => [
      {
        accessorKey: 'ruleKey',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Rule Key' />
        ),
        cell: ({ row }) => (
          <button
            className='font-medium text-primary hover:underline'
            onClick={() => setDetailKey(row.original.ruleKey)}
          >
            {row.original.ruleKey}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Name' />
        ),
        cell: ({ row }) => row.original.name || '—',
      },
      {
        accessorKey: 'ruleType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <Badge variant='outline'>{row.original.ruleType}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'ACTIVE' ? 'default' : 'secondary'
            }
          >
            {row.original.status || 'UNKNOWN'}
          </Badge>
        ),
      },
      {
        accessorKey: 'version',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Version' />
        ),
        cell: ({ row }) => `v${row.original.version ?? 1}`,
      },
      {
        accessorKey: 'lastEvaluatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Last Evaluated' />
        ),
        cell: ({ row }) =>
          row.original.lastEvaluatedAt
            ? format(new Date(row.original.lastEvaluatedAt), 'MMM d, yyyy')
            : 'Never',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => {
                setEditItem(row.original)
                setDialogOpen(true)
              }}
            >
              <Edit className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => setDetailKey(row.original.ruleKey)}
            >
              <Eye className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Business Rules</h1>
          <p className='text-muted-foreground'>
            Configure putaway, allocation, picking, and other business rules
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className='mr-2 h-4 w-4' />
            Create Rule
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Input
          placeholder='Search rules...'
          value={globalFilter ?? ''}
          onChange={(e) => {
            setGlobalFilter(e.target.value)
            setPagination({ pageIndex: 0, pageSize })
          }}
          className='max-w-sm'
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>
            {data?.total ?? items.length} rule
            {(data?.total ?? items.length) !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load rules
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              No rules found. Click "Create Rule" to add one.
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
                            {h.isPlaceholder
                              ? null
                              : flexRender(
                                  h.column.columnDef.header,
                                  h.getContext()
                                )}
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
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <RuleDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(null) }}
        editItem={editItem}
        onSuccess={() => refetch()}
      />

      <RuleDetailDialog
        open={!!detailKey}
        onOpenChange={(open) => { if (!open) setDetailKey(null) }}
        ruleKey={detailKey}
      />
    </div>
  )
}
