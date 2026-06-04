import { useMemo } from 'react'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Loader2, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { LoadStatusBadge } from '@/components/status-badges'
import { useLoadShipments, type Load, type LoadShipment } from '../data/load-queries'

interface LoadDetailDialogProps {
  load: Load
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssignShipments: () => void
}

function ShipmentTable({ shipments }: { shipments: LoadShipment[] }) {
  const columns: ColumnDef<LoadShipment, any>[] = useMemo(
    () => [
      {
        accessorKey: 'shipmentId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Shipment ID' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.original.shipmentId || row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'carrierCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Carrier' />
        ),
        cell: ({ row }) => (
          <span>{row.original.carrierCode || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <Badge variant='outline'>{row.original.status || 'assigned'}</Badge>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: shipments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className='space-y-1'>
      <div className='flex justify-between text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-medium'>{pct}%</span>
      </div>
      <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
        <div
          className='h-full rounded-full bg-primary transition-all'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function LoadDetailDialog({
  load,
  open,
  onOpenChange,
  onAssignShipments,
}: LoadDetailDialogProps) {
  const { data: shipments, isLoading: shipmentsLoading } = useLoadShipments(load.id)

  const shipmentCount = useMemo(
    () => shipments?.length ?? load.shipments?.length ?? load.shipmentIds?.length ?? 0,
    [shipments, load]
  )

  const loadingProgress = useMemo(() => {
    if (!shipments || shipments.length === 0) return 0
    const loaded = shipments.filter(
      (s) => s.status?.toLowerCase() === 'loaded' || s.status?.toLowerCase() === 'departed'
    ).length
    return loaded
  }, [shipments])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>Load {load.loadNumber}</DialogTitle>
          <DialogDescription>
            <LoadStatusBadge
              status={(load.status?.toUpperCase() || 'CREATED') as any}
            />
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid grid-cols-2 gap-3 rounded-lg border p-4'>
            <div>
              <p className='text-xs text-muted-foreground'>Facility</p>
              <p className='text-sm font-medium'>{load.facilityId}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Carrier</p>
              <p className='text-sm font-medium'>{load.carrierCode || '—'}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Dock Door</p>
              <p className='text-sm font-medium'>{load.dockDoorCode || '—'}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Vehicle Plate</p>
              <p className='text-sm font-medium'>{load.vehiclePlate || '—'}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Driver</p>
              <p className='text-sm font-medium'>{load.driverName || '—'}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Driver Phone</p>
              <p className='text-sm font-medium'>{load.driverPhone || '—'}</p>
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-semibold'>Loading Progress</h4>
            <ProgressBar
              value={loadingProgress}
              max={shipmentCount}
              label='Shipments loaded'
            />
          </div>

          <div>
            <div className='mb-2 flex items-center justify-between'>
              <h4 className='text-sm font-semibold'>
                Assigned Shipments ({shipmentCount})
              </h4>
              <Button variant='outline' size='sm' onClick={onAssignShipments}>
                <Package className='mr-2 h-4 w-4' />
                Add Shipment
              </Button>
            </div>
            {shipmentsLoading ? (
              <div className='flex items-center justify-center py-6'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            ) : shipmentCount === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                No shipments assigned to this load yet.
              </p>
            ) : (
              <ShipmentTable shipments={(shipments ?? load.shipments ?? [])} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
