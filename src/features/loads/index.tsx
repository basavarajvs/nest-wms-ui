import { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import type { LoadStatus } from '@/types/warehouse-statuses'
import {
  Plus,
  Edit,
  Trash2,
  Truck,
  Ship,
  Eye,
  Package,
  MoreHorizontal,
  Play,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { LoadStatusBadge } from '@/components/status-badges'
import { useFacility } from '@/hooks/useFacility'
import {
  useLoads,
  useDeleteLoad,
  useUpdateLoadStatus,
  useMarkLoadLoaded,
  useMarkLoadDeparted,
  type Load,
} from './data/load-queries'
import { LoadCreateDialog } from './components/LoadCreateDialog'
import { LoadDetailDialog } from './components/LoadDetailDialog'
import { AddShipmentToLoadDialog } from './components/AddShipmentToLoadDialog'

export function Loads() {
  const [sorting, setSorting] = useState<SortingState>([])
  const { selectedFacility } = useFacility()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLoad, setEditingLoad] = useState<Load | null>(null)
  const [detailLoad, setDetailLoad] = useState<Load | null>(null)
  const [assignShipmentLoad, setAssignShipmentLoad] = useState<Load | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const facilityId = selectedFacility?.id ?? ''

  const { data, isLoading, error, refetch } = useLoads({ facilityId })
  const deleteMutation = useDeleteLoad()
  const updateStatusMutation = useUpdateLoadStatus()
  const markLoadedMutation = useMarkLoadLoaded()
  const markDepartedMutation = useMarkLoadDeparted()

  const loads = data?.loads ?? []
  const isPending =
    updateStatusMutation.isPending ||
    markLoadedMutation.isPending ||
    markDepartedMutation.isPending

  const getAvailableTransitions = useCallback((currentStatus?: string) => {
    const s = currentStatus?.toUpperCase() || 'CREATED'
    switch (s) {
      case 'CREATED':
      case 'PLANNED':
        return [{ value: 'LOADING', label: 'Start Loading', icon: Play }]
      case 'LOADING':
        return [{ value: 'LOADED', label: 'Mark Loaded', icon: Truck }]
      case 'LOADED':
        return [{ value: 'DEPARTED', label: 'Mark Departed', icon: Ship }]
      default:
        return []
    }
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Load deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      if (status === 'LOADED') {
        await markLoadedMutation.mutateAsync(id)
      } else if (status === 'DEPARTED') {
        await markDepartedMutation.mutateAsync(id)
      } else {
        await updateStatusMutation.mutateAsync({ id, status })
      }
      toast.success(`Load status updated to ${status}`)
    } catch (err: any) {
      toast.error(err?.message || `Failed to update status to ${status}`)
    }
  }

  const columns: ColumnDef<Load, any>[] = useMemo(
    () => [
      {
        accessorKey: 'loadNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Load Number' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.loadNumber}</span>
        ),
      },
      {
        accessorKey: 'facilityId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Facility' />
        ),
      },
      {
        accessorKey: 'dockDoorCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Dock Door' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.dockDoorCode || '—'}</span>
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
        id: 'driverInfo',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Driver / Plate' />
        ),
        cell: ({ row }) => (
          <span className='text-sm'>
            {[row.original.driverName, row.original.vehiclePlate]
              .filter(Boolean)
              .join(' / ') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <LoadStatusBadge
            status={
              (row.original.status?.toUpperCase() as LoadStatus) ||
              (row.original.status as LoadStatus)
            }
          />
        ),
        filterFn: 'arrIncludesSome',
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const load = row.original
          const transitions = getAvailableTransitions(load.status)
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setDetailLoad(load)}>
                  <Eye className='mr-2 h-4 w-4' />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAssignShipmentLoad(load)}>
                  <Package className='mr-2 h-4 w-4' />
                  Add Shipment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setEditingLoad(load); setDialogOpen(true) }}>
                  <Edit className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
                {transitions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {transitions.map((t) => (
                      <DropdownMenuItem
                        key={t.value}
                        onClick={() => handleStatusUpdate(load.id, t.value)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        ) : (
                          <t.icon className='mr-2 h-4 w-4' />
                        )}
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={() => setDeleteId(load.id)}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [getAvailableTransitions, isPending]
  )

  const table = useReactTable({
    data: loads,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Loads</h1>
          <p className='text-muted-foreground'>
            Manage outbound loads and shipments
          </p>
        </div>
        <Button onClick={() => { setEditingLoad(null); setDialogOpen(true) }}>
          <Plus className='mr-2 h-4 w-4' /> New Load
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Loads ({loads.length})</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode || selectedFacility.id}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableToolbar
            table={table}
            searchKey='loadNumber'
            searchPlaceholder='Filter by load number...'
            filters={[
              {
                columnId: 'status',
                title: 'Status',
                options: [
                  { label: 'Created', value: 'created' },
                  { label: 'Planned', value: 'planned' },
                  { label: 'Loading', value: 'loading' },
                  { label: 'Loaded', value: 'loaded' },
                  { label: 'Departed', value: 'departed' },
                  { label: 'Cancelled', value: 'cancelled' },
                ],
              },
            ]}
          />
          {isLoading ? (
            <div className='mt-4 space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load loads</p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <p className='font-medium text-muted-foreground'>No loads found</p>
              <p className='max-w-md text-sm text-muted-foreground'>
                Create a new load to get started.
              </p>
            </div>
          ) : (
            <>
              <div className='mt-4 rounded-md border'>
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
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <LoadCreateDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingLoad(null)
        }}
        editingLoad={editingLoad}
      />

      {detailLoad && (
        <LoadDetailDialog
          load={detailLoad}
          open={!!detailLoad}
          onOpenChange={(open) => { if (!open) setDetailLoad(null) }}
          onAssignShipments={() => {
            const l = detailLoad
            setDetailLoad(null)
            setAssignShipmentLoad(l)
          }}
        />
      )}

      {assignShipmentLoad && (
        <AddShipmentToLoadDialog
          loadId={assignShipmentLoad.id}
          dockDoorCode={assignShipmentLoad.dockDoorCode}
          open={!!assignShipmentLoad}
          onOpenChange={(open) => { if (!open) setAssignShipmentLoad(null) }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Load?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
