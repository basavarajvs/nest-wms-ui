import { useState } from 'react'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useWorkOrderList,
  useReleaseWorkOrder,
  useCompleteWorkOrder,
  useCancelWorkOrder,
  type WorkOrder,
} from '@/features/work-orders/data/work-order-queries'
import { WorkOrderDialog } from '@/features/work-orders/components/WorkOrderDialog'
import { useFacility } from '@/hooks/useFacility'

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  RELEASED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const priorityBadge: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

const WORK_ORDER_ACTIONS: Record<string, string[]> = {
  DRAFT: ['Edit', 'Release'],
  RELEASED: ['Complete', 'Cancel', 'Edit'],
  IN_PROGRESS: ['Complete', 'Cancel'],
  COMPLETED: [],
  CANCELLED: [],
}

export function WorkOrdersListPage() {
  const navigate = useNavigate()
  const { currentFacility } = useFacility()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrder | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useWorkOrderList({
    facilityId: currentFacility?.id || '',
    status: statusFilter || undefined,
    workOrderType: typeFilter || undefined,
  })

  const release = useReleaseWorkOrder()
  const complete = useCompleteWorkOrder()
  const cancel = useCancelWorkOrder()

  const workOrders = data?.workOrders || []

  const handleAction = async (action: string, wo: WorkOrder) => {
    try {
      if (action === 'Release') {
        await release.mutateAsync(wo.id)
        toast.success('Work order released')
      } else if (action === 'Complete') {
        await complete.mutateAsync(wo.id)
        toast.success('Work order completed')
      } else if (action === 'Cancel') {
        await cancel.mutateAsync(wo.id)
        toast.success('Work order cancelled')
      } else if (action === 'Edit') {
        setEditing(wo)
        setOpen(true)
      } else if (action === 'View') {
        navigate({ to: '/work-orders/$id', params: { id: wo.id } })
      }
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${action.toLowerCase()}`)
    }
  }

  const columns: ColumnDef<WorkOrder>[] = [
    {
      accessorKey: 'workOrderNumber',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Order #' />,
      cell: ({ row }) => (
        <Button variant='link' className='p-0 h-auto font-medium' onClick={() => navigate({ to: '/work-orders/$id', params: { id: row.original.id } })}>
          {row.original.workOrderNumber || row.original.id.slice(0, 8)}
        </Button>
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'workOrderType',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
      cell: ({ row }) => <Badge variant='outline'>{row.original.workOrderType?.replace(/_/g, ' ')}</Badge>,
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
      cell: ({ row }) => (
        <Badge className={statusBadge[row.original.status] || ''}>{row.original.status?.replace(/_/g, ' ')}</Badge>
      ),
      size: 120,
      minSize: 100,
      maxSize: 140,
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Priority' />,
      cell: ({ row }) => row.original.priority ? <Badge className={priorityBadge[row.original.priority] || ''}>{row.original.priority}</Badge> : '-',
      size: 100,
      minSize: 80,
      maxSize: 120,
    },
    {
      accessorKey: 'productId',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
      size: 150,
      minSize: 120,
      maxSize: 200,
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Qty' />,
      cell: ({ row }) => row.original.quantity ?? '-',
      size: 80,
      minSize: 70,
      maxSize: 110,
    },
    {
      accessorKey: 'clientId',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />,
      size: 130,
      minSize: 110,
      maxSize: 170,
    },
    {
      accessorKey: 'assignedToUserId',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Assigned To' />,
      size: 130,
      minSize: 110,
      maxSize: 170,
    },
    {
      accessorKey: 'scheduledDate',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Scheduled' />,
      cell: ({ row }) => row.original.scheduledDate ? new Date(row.original.scheduledDate).toLocaleDateString() : '-',
      size: 110,
      minSize: 90,
      maxSize: 140,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 180,
      minSize: 150,
      maxSize: 220,
      cell: ({ row }) => {
        const wo = row.original
        const actions = WORK_ORDER_ACTIONS[wo.status] || []
        return (
          <div className='flex gap-1 flex-wrap'>
            <Button size='sm' variant='ghost' onClick={() => handleAction('View', wo)}><Eye className='h-4 w-4' /></Button>
            {actions.map((a) => (
              <Button
                key={a}
                size='sm'
                variant='outline'
                onClick={() => handleAction(a, wo)}
                disabled={release.isPending || complete.isPending || cancel.isPending}
              >
                {release.isPending || complete.isPending || cancel.isPending
                  ? <Loader2 className='h-3 w-3 animate-spin' />
                  : a
                }
              </Button>
            ))}
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: workOrders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Work Orders</h1>
        <Button onClick={() => { setEditing(null); setOpen(true) }}><Plus className='mr-2 h-4 w-4' />Create Work Order</Button>
      </div>
      <div className='flex gap-2'>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className='w-[160px]'><SelectValue placeholder='All statuses' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='DRAFT'>Draft</SelectItem>
            <SelectItem value='RELEASED'>Released</SelectItem>
            <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
            <SelectItem value='COMPLETED'>Completed</SelectItem>
            <SelectItem value='CANCELLED'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className='w-[160px]'><SelectValue placeholder='All types' /></SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='ASSEMBLY'>Assembly</SelectItem>
            <SelectItem value='DISASSEMBLY'>Disassembly</SelectItem>
            <SelectItem value='KITTING'>Kitting</SelectItem>
            <SelectItem value='REPAIR'>Repair</SelectItem>
            <SelectItem value='CUSTOM'>Custom</SelectItem>
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
            ) : workOrders.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8 text-muted-foreground'>No work orders found.</TableCell></TableRow>
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
      <WorkOrderDialog open={open} onOpenChange={setOpen} workOrder={editing} />
    </div>
  )
}
