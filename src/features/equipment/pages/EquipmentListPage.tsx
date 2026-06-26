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
import { ChangeStatusDialog } from '@/features/equipment/components/ChangeStatusDialog'
import { EquipmentDialog } from '@/features/equipment/components/EquipmentDialog'
import { MaintenanceDialog } from '@/features/equipment/components/MaintenanceDialog'
import {
  useEquipmentList,
  type EquipmentItem,
} from '@/features/equipment/data/equipment-queries'

const statusBadge: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  IN_USE: 'bg-blue-100 text-blue-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
  DECOMMISSIONED: 'bg-gray-100 text-gray-800',
}

export function EquipmentListPage() {
  const { currentFacility } = useFacility()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EquipmentItem | null>(null)
  const [changeStatusTarget, setChangeStatusTarget] =
    useState<EquipmentItem | null>(null)
  const [maintenanceTarget, setMaintenanceTarget] =
    useState<EquipmentItem | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useEquipmentList({
    facilityId: currentFacility?.id || '',
    equipmentType: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  const equipment = data?.equipment || []

  const columns: ColumnDef<EquipmentItem>[] = [
    {
      accessorKey: 'equipmentCode',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Code' />
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'equipmentName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Name' />
      ),
      size: 200,
      minSize: 160,
      maxSize: 250,
    },
    {
      accessorKey: 'equipmentType',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Type' />
      ),
      cell: ({ row }) => (
        <Badge variant='outline'>
          {row.original.equipmentType?.replace(/_/g, ' ')}
        </Badge>
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: ({ row }) => (
        <Badge className={statusBadge[row.original.status] || ''}>
          {row.original.status?.replace(/_/g, ' ')}
        </Badge>
      ),
      size: 130,
      minSize: 110,
      maxSize: 150,
    },
    {
      accessorKey: 'locationId',
      header: 'Location',
      size: 140,
      minSize: 120,
      maxSize: 170,
    },
    {
      accessorKey: 'serialNumber',
      header: 'Serial #',
      size: 130,
      minSize: 110,
      maxSize: 150,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const eq = row.original
        const s = eq.status
        return (
          <div className='flex flex-wrap gap-1'>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => {
                setEditing(eq)
                setOpen(true)
              }}
            >
              <Pencil className='h-4 w-4' />
            </Button>
            {s !== 'DECOMMISSIONED' && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setChangeStatusTarget(eq)}
              >
                Change Status
              </Button>
            )}
            {(s === 'AVAILABLE' || s === 'OUT_OF_SERVICE') && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setMaintenanceTarget(eq)}
              >
                Maintenance
              </Button>
            )}
          </div>
        )
      },
      size: 200,
      minSize: 160,
      maxSize: 250,
    },
  ]

  const table = useReactTable({
    data: equipment,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Equipment Registry</h1>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          Register Equipment
        </Button>
      </div>
      <div className='flex gap-2'>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='All types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='FORKLIFT'>Forklift</SelectItem>
            <SelectItem value='PALLET_JACK'>Pallet Jack</SelectItem>
            <SelectItem value='HAND_TRUCK'>Hand Truck</SelectItem>
            <SelectItem value='CONVEYOR'>Conveyor</SelectItem>
            <SelectItem value='SCANNER'>Scanner</SelectItem>
            <SelectItem value='PRINTER'>Printer</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className='w-[160px]'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='AVAILABLE'>Available</SelectItem>
            <SelectItem value='IN_USE'>In Use</SelectItem>
            <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
            <SelectItem value='OUT_OF_SERVICE'>Out of Service</SelectItem>
            <SelectItem value='DECOMMISSIONED'>Decommissioned</SelectItem>
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
                  No equipment found
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
      <EquipmentDialog open={open} onOpenChange={setOpen} equipment={editing} />
      {changeStatusTarget && (
        <ChangeStatusDialog
          open={!!changeStatusTarget}
          onOpenChange={(o) => {
            if (!o) setChangeStatusTarget(null)
          }}
          equipmentId={changeStatusTarget.id}
          currentStatus={changeStatusTarget.status}
        />
      )}
      {maintenanceTarget && (
        <MaintenanceDialog
          open={!!maintenanceTarget}
          onOpenChange={(o) => {
            if (!o) setMaintenanceTarget(null)
          }}
          equipmentId={maintenanceTarget.id}
          equipmentName={maintenanceTarget.equipmentName}
        />
      )}
    </div>
  )
}
