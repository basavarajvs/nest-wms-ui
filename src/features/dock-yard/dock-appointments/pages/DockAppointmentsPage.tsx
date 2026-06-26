import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { AppointmentDialog } from '@/features/dock-yard/dock-appointments/components/AppointmentDialog'
import {
  useAppointmentList,
  useCheckIn,
  useCompleteAppointment,
  useCancelAppointment,
  type DockAppointment,
} from '@/features/dock-yard/dock-appointments/data/dock-appointment-queries'

const statusBadge: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

export function DockAppointmentsPage() {
  const { currentFacility } = useFacility()
  const [open, setOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useAppointmentList({
    facilityId: currentFacility?.id || '',
    status: statusFilter || undefined,
  })

  const checkIn = useCheckIn()
  const complete = useCompleteAppointment()
  const cancel = useCancelAppointment()

  const appointments = useMemo(() => {
    if (!data?.appointments) return []
    let list = data.appointments
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.carrierName?.toLowerCase().includes(q) ||
          a.driverName?.toLowerCase().includes(q) ||
          a.vehiclePlate?.toLowerCase().includes(q)
      )
    }
    return list
  }, [data, search])

  const columns: ColumnDef<DockAppointment>[] = [
    {
      accessorKey: 'appointmentNumber',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Appointment #' />
      ),
      size: 140,
      minSize: 120,
      maxSize: 170,
    },
    {
      accessorKey: 'appointmentType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Type' />
      ),
      cell: ({ row }) => (
        <Badge variant='outline'>{row.original.appointmentType}</Badge>
      ),
      size: 100,
      minSize: 90,
      maxSize: 130,
    },
    {
      accessorKey: 'dockName',
      header: 'Dock',
      size: 100,
      minSize: 90,
      maxSize: 130,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ row }) => (
        <Badge className={statusBadge[row.original.status] || ''}>
          {row.original.status}
        </Badge>
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'scheduledStart',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Start' />
      ),
      cell: ({ row }) => new Date(row.original.scheduledStart).toLocaleString(),
      size: 150,
      minSize: 130,
      maxSize: 170,
    },
    {
      accessorKey: 'scheduledEnd',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='End' />
      ),
      cell: ({ row }) => new Date(row.original.scheduledEnd).toLocaleString(),
      size: 150,
      minSize: 130,
      maxSize: 170,
    },
    {
      accessorKey: 'carrierName',
      header: 'Carrier',
      size: 130,
      minSize: 110,
      maxSize: 160,
    },
    {
      accessorKey: 'driverName',
      header: 'Driver',
      size: 120,
      minSize: 100,
      maxSize: 150,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const a = row.original
        return (
          <div className='flex gap-1'>
            {a.status === 'SCHEDULED' && (
              <Button
                size='sm'
                variant='outline'
                onClick={async () => {
                  try {
                    await checkIn.mutateAsync(a.id)
                    toast.success('Checked in')
                  } catch (e: any) {
                    toast.error(e?.message)
                  }
                }}
              >
                Check In
              </Button>
            )}
            {a.status === 'CHECKED_IN' && (
              <Button
                size='sm'
                variant='outline'
                onClick={async () => {
                  try {
                    await complete.mutateAsync(a.id)
                    toast.success('Completed')
                  } catch (e: any) {
                    toast.error(e?.message)
                  }
                }}
              >
                Complete
              </Button>
            )}
            {(a.status === 'SCHEDULED' || a.status === 'CHECKED_IN') && (
              <Button
                size='sm'
                variant='outline'
                className='text-red-600'
                onClick={async () => {
                  try {
                    await cancel.mutateAsync(a.id)
                    toast.success('Cancelled')
                  } catch (e: any) {
                    toast.error(e?.message)
                  }
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        )
      },
      size: 220,
      minSize: 180,
      maxSize: 260,
    },
  ]

  const table = useReactTable({
    data: appointments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Dock Appointments</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          New Appointment
        </Button>
      </div>
      <div className='flex gap-2'>
        <Input
          placeholder='Search appointments...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-xs'
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
            <SelectItem value='CHECKED_IN'>Checked In</SelectItem>
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
                  No appointments found
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
      <AppointmentDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
