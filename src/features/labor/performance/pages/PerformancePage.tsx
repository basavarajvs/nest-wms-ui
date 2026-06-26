import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { usePerformanceList, type LaborPerformance } from '@/features/labor/performance/data/performance-queries'
import { useFacility } from '@/hooks/useFacility'

export function PerformancePage() {
  const { currentFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [dateFilter, setDateFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')

  const { data, isLoading } = usePerformanceList({
    facilityId: currentFacility?.id || '',
    userId: userIdFilter || undefined,
    metricDate: dateFilter || undefined,
  })

  const metrics = data?.metrics || []

  const columns: ColumnDef<LaborPerformance>[] = [
    {
      accessorKey: 'userName',
      header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
    },
    {
      accessorKey: 'metricDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
      cell: ({ row }) => new Date(row.original.metricDate).toLocaleDateString(),
    },
    {
      accessorKey: 'picksPerHour',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Picks/hr' />,
      cell: ({ row }) => row.original.picksPerHour?.toFixed(1) ?? '-',
    },
    {
      accessorKey: 'packsPerHour',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Packs/hr' />,
      cell: ({ row }) => row.original.packsPerHour?.toFixed(1) ?? '-',
    },
    {
      accessorKey: 'accuracyRate',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Accuracy %' />,
      cell: ({ row }) => row.original.accuracyRate != null ? `${(row.original.accuracyRate * 100).toFixed(1)}%` : '-',
    },
    {
      accessorKey: 'score',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Score' />,
      cell: ({ row }) => row.original.score?.toFixed(1) ?? '-',
    },
  ]

  const table = useReactTable({
    data: metrics,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Performance Metrics</h1>
      </div>
      <div className='flex gap-2'>
        <Input
          placeholder='Filter by User ID'
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          className='max-w-xs'
        />
        <Input
          type='date'
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className='w-[180px]'
        />
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>Loading...</TableCell></TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>No performance data found</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
