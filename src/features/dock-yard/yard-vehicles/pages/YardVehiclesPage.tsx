import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useVehicleList, useDepartVehicle,
  type YardVehicle,
} from '@/features/dock-yard/yard-vehicles/data/yard-vehicle-queries'
import { VehicleDialog } from '@/features/dock-yard/yard-vehicles/components/VehicleDialog'
import { AssignDockDialog } from '@/features/dock-yard/yard-vehicles/components/AssignDockDialog'
import { useFacility } from '@/hooks/useFacility'
import { toast } from 'sonner'

const statusBadge: Record<string, string> = {
  IN_YARD: 'bg-blue-100 text-blue-800',
  AT_DOCK: 'bg-purple-100 text-purple-800',
  DEPARTED: 'bg-gray-100 text-gray-800',
}

export function YardVehiclesPage() {
  const { currentFacility } = useFacility()
  const [openRegister, setOpenRegister] = useState(false)
  const [assignTarget, setAssignTarget] = useState<{ id: string; plate: string } | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useVehicleList({
    facilityId: currentFacility?.id || '',
    status: statusFilter || undefined,
  })

  const depart = useDepartVehicle()

  const vehicles = useMemo(() => {
    if (!data?.vehicles) return []
    let list = data.vehicles
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (v) =>
          v.vehiclePlate.toLowerCase().includes(q) ||
          v.driverName?.toLowerCase().includes(q) ||
          v.carrierCode?.toLowerCase().includes(q),
      )
    }
    return list
  }, [data, search])

  const columns: ColumnDef<YardVehicle>[] = [
    {
      accessorKey: 'vehiclePlate',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Plate' />,
    },
    {
      accessorKey: 'vehicleType',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
      cell: ({ row }) => (
        <Badge variant='outline'>{row.original.vehicleType}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
      cell: ({ row }) => (
        <Badge className={statusBadge[row.original.status] || ''}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'dockName',
      header: 'Dock',
    },
    {
      accessorKey: 'driverName',
      header: 'Driver',
    },
    {
      accessorKey: 'carrierCode',
      header: 'Carrier',
    },
    {
      accessorKey: 'yardLocation',
      header: 'Location',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const v = row.original
        const canAssign = v.status === 'IN_YARD'
        const canDepart = v.status === 'AT_DOCK' || v.status === 'IN_YARD'
        return (
          <div className='flex gap-1'>
            {canAssign && (
              <Button size='sm' variant='outline' onClick={() => setAssignTarget({ id: v.id, plate: v.vehiclePlate })}>
                Assign Dock
              </Button>
            )}
            {canDepart && (
              <Button size='sm' variant='outline' className='text-orange-600' onClick={async () => { try { await depart.mutateAsync(v.id); toast.success('Departed') } catch (e: any) { toast.error(e?.message) } }}>
                Depart
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: vehicles,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Yard Vehicles</h1>
        <Button onClick={() => setOpenRegister(true)}><Plus className='mr-2 h-4 w-4' />Register Vehicle</Button>
      </div>
      <div className='flex gap-2'>
        <Input
          placeholder='Search vehicles...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-xs'
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className='w-[160px]'><SelectValue placeholder='All statuses' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='IN_YARD'>In Yard</SelectItem>
            <SelectItem value='AT_DOCK'>At Dock</SelectItem>
            <SelectItem value='DEPARTED'>Departed</SelectItem>
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
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>No vehicles found</TableCell></TableRow>
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
      <VehicleDialog open={openRegister} onOpenChange={setOpenRegister} />
      {assignTarget && (
        <AssignDockDialog
          open={!!assignTarget}
          onOpenChange={(o) => { if (!o) setAssignTarget(null) }}
          vehicleId={assignTarget.id}
          vehiclePlate={assignTarget.plate}
        />
      )}
    </div>
  )
}
