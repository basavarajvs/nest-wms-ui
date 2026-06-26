import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useMaintenanceList, type MaintenanceRecord } from '@/features/equipment/data/maintenance-queries'
import { CompleteMaintenanceDialog } from '@/features/equipment/components/CompleteMaintenanceDialog'
import { Button } from '@/components/ui/button'
import { useFacility } from '@/hooks/useFacility'

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const priorityBadge: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

export function MaintenanceRecordsPage() {
  const { currentFacility } = useFacility()
  const [completeTarget, setCompleteTarget] = useState<MaintenanceRecord | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useMaintenanceList({
    facilityId: currentFacility?.id || '',
    status: statusFilter || undefined,
  })

  const records = data?.records || []

  const columns: ColumnDef<MaintenanceRecord>[] = [
    {
      accessorKey: 'equipmentCode',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Equipment' />,
    },
    {
      accessorKey: 'equipmentName',
      header: 'Name',
    },
    {
      accessorKey: 'maintenanceType',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
      cell: ({ row }) => <Badge variant='outline'>{row.original.maintenanceType}</Badge>,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
      cell: ({ row }) => row.original.priority ? <Badge className={priorityBadge[row.original.priority] || ''}>{row.original.priority}</Badge> : '-',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
      cell: ({ row }) => (
        <Badge className={statusBadge[row.original.status] || ''}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'cost',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Cost' />,
      cell: ({ row }) => row.original.cost != null ? `$${row.original.cost.toFixed(2)}` : '-',
    },
    {
      accessorKey: 'downtimeMinutes',
      header: 'Downtime',
      cell: ({ row }) => row.original.downtimeMinutes != null ? `${row.original.downtimeMinutes} min` : '-',
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const r = row.original
        const canComplete = r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
        return (
          <div>
            {canComplete && (
              <Button size='sm' variant='outline' onClick={() => setCompleteTarget(r)}>Complete</Button>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Maintenance Records</h1>
      </div>
      <div className='flex gap-2'>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className='w-[160px]'><SelectValue placeholder='All statuses' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='PENDING'>Pending</SelectItem>
            <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
            <SelectItem value='COMPLETED'>Completed</SelectItem>
            <SelectItem value='CANCELLED'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>No maintenance records found</TableCell></TableRow>
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
      {completeTarget && (
        <CompleteMaintenanceDialog open={!!completeTarget} onOpenChange={(o) => { if (!o) setCompleteTarget(null) }} maintenanceId={completeTarget.id} />
      )}
    </div>
  )
}
