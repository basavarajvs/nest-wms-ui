import { useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Plus, Pencil } from 'lucide-react'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { ShiftDialog } from '@/features/labor/shifts/components/ShiftDialog'
import {
  useShiftList,
  type LaborShift,
} from '@/features/labor/shifts/data/shift-queries'

export function ShiftsPage() {
  const { currentFacility } = useFacility()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LaborShift | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading } = useShiftList({
    facilityId: currentFacility?.id || '',
  })
  const shifts = data?.shifts || []

  const columns: ColumnDef<LaborShift>[] = [
    {
      accessorKey: 'shiftCode',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Code' />
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'shiftName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Name' />
      ),
      size: 200,
      minSize: 160,
      maxSize: 250,
    },
    {
      accessorKey: 'startTime',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Start' />
      ),
      size: 90,
      minSize: 80,
      maxSize: 110,
    },
    {
      accessorKey: 'endTime',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='End' />
      ),
      size: 90,
      minSize: 80,
      maxSize: 110,
    },
    {
      accessorKey: 'timezone',
      header: 'Timezone',
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Active' />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size='sm'
          variant='ghost'
          onClick={() => {
            setEditing(row.original)
            setOpen(true)
          }}
        >
          <Pencil className='h-4 w-4' />
        </Button>
      ),
      size: 80,
      minSize: 60,
      maxSize: 100,
    },
  ]

  const table = useReactTable({
    data: shifts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Labor Shifts</h1>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          New Shift
        </Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='py-8 text-center'
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='py-8 text-center'
                >
                  No shifts found
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
      <ShiftDialog open={open} onOpenChange={setOpen} shift={editing} />
    </div>
  )
}
