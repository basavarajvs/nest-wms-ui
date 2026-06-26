import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useTimeLogList, type LaborTimeLog } from '@/features/labor/time-logs/data/time-log-queries'
import { useFacility } from '@/hooks/useFacility'

const statusBadge: Record<string, string> = {
  CLOCKED_IN: 'bg-green-100 text-green-800',
  CLOCKED_OUT: 'bg-gray-100 text-gray-800',
  BREAK: 'bg-yellow-100 text-yellow-800',
}

export function TimeLogsPage() {
  const { currentFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [dateFilter, setDateFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')

  const { data, isLoading } = useTimeLogList({
    facilityId: currentFacility?.id || '',
    userId: userIdFilter || undefined,
    date: dateFilter || undefined,
  })

  const timeLogs = data?.timeLogs || []

  const columns: ColumnDef<LaborTimeLog>[] = [
    {
      accessorKey: 'userName',
      header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
    },
    {
      accessorKey: 'shiftName',
      header: 'Shift',
    },
    {
      accessorKey: 'clockIn',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Clock In' />,
      cell: ({ row }) => new Date(row.original.clockIn).toLocaleString(),
    },
    {
      accessorKey: 'clockOut',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Clock Out' />,
      cell: ({ row }) => row.original.clockOut ? new Date(row.original.clockOut).toLocaleString() : '-',
    },
    {
      accessorKey: 'breakDuration',
      header: 'Break (min)',
      cell: ({ row }) => row.original.breakDuration ?? '-',
    },
    {
      accessorKey: 'totalMinutes',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Total Min' />,
      cell: ({ row }) => row.original.totalMinutes ?? '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
      cell: ({ row }) => (
        <Badge className={statusBadge[row.original.status] || ''}>{row.original.status}</Badge>
      ),
    },
  ]

  const table = useReactTable({
    data: timeLogs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Time Logs</h1>
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
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>No time logs found</TableCell></TableRow>
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
