import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useAssignmentList, type LaborAssignment } from '@/features/labor/assignments/data/assignment-queries'
import { AssignmentDialog } from '@/features/labor/assignments/components/AssignmentDialog'

export function AssignmentsPage() {
  const { currentFacility } = useFacility()
  const [open, setOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useAssignmentList({ userId: '', shiftId: '' })
  const assignments = data?.assignments || []

  const columns: ColumnDef<LaborAssignment>[] = [
    {
      accessorKey: 'userName',
      header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
    },
    {
      accessorKey: 'shiftCode',
      header: 'Shift Code',
    },
    {
      accessorKey: 'shiftName',
      header: 'Shift Name',
    },
    {
      accessorKey: 'effectiveDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Effective' />,
      cell: ({ row }) => row.original.effectiveDate ? new Date(row.original.effectiveDate).toLocaleDateString() : '-',
    },
    {
      accessorKey: 'expiryDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Expires' />,
      cell: ({ row }) => row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString() : '-',
    },
  ]

  const table = useReactTable({
    data: assignments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Shift Assignments</h1>
        <Button onClick={() => setOpen(true)}><Plus className='mr-2 h-4 w-4' />New Assignment</Button>
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
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>No assignments found</TableCell></TableRow>
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
      <AssignmentDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
