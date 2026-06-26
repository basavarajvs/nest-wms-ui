import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  type ColumnDef, getCoreRowModel, useReactTable, flexRender,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useWorkOrder,
  useReleaseWorkOrder,
  useCompleteWorkOrder,
  useCancelWorkOrder,
  useAddOperation,
  useAddComponent,
  type WorkOrderOperation,
  type WorkOrderComponent,
} from '@/features/work-orders/data/work-order-queries'
import { OperationDialog } from '@/features/work-orders/components/OperationDialog'
import { ComponentDialog } from '@/features/work-orders/components/ComponentDialog'

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

export function WorkOrderDetailPage() {
  const { id } = useParams({ from: '/_authenticated/work-orders/$id' })
  const navigate = useNavigate()
  const [opOpen, setOpOpen] = useState(false)
  const [compOpen, setCompOpen] = useState(false)

  const { data: wo, isLoading } = useWorkOrder(id)
  const release = useReleaseWorkOrder()
  const complete = useCompleteWorkOrder()
  const cancel = useCancelWorkOrder()

  const handleAction = async (action: string) => {
    try {
      if (action === 'Release') { await release.mutateAsync(id); toast.success('Work order released') }
      else if (action === 'Complete') { await complete.mutateAsync(id); toast.success('Work order completed') }
      else if (action === 'Cancel') { await cancel.mutateAsync(id); toast.success('Work order cancelled') }
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${action.toLowerCase()}`)
    }
  }

  const ACTIONS: Record<string, string[]> = {
    DRAFT: ['Release'],
    RELEASED: ['Complete', 'Cancel'],
    IN_PROGRESS: ['Complete', 'Cancel'],
    COMPLETED: [],
    CANCELLED: [],
  }

  const currentActions = ACTIONS[wo?.status || ''] || []

  const opColumns: ColumnDef<WorkOrderOperation>[] = [
    { accessorKey: 'sequenceNumber', header: ({ column }) => <DataTableColumnHeader column={column} title='Seq' />, cell: ({ row }) => row.original.sequenceNumber },
    { accessorKey: 'operationName', header: ({ column }) => <DataTableColumnHeader column={column} title='Name' /> },
    { accessorKey: 'operationType', header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />, cell: ({ row }) => <Badge variant='outline'>{row.original.operationType?.replace(/_/g, ' ')}</Badge> },
    { accessorKey: 'assignedToUserId', header: 'Assigned' },
    { accessorKey: 'estimatedMinutes', header: ({ column }) => <DataTableColumnHeader column={column} title='Est (min)' />, cell: ({ row }) => row.original.estimatedMinutes ?? '-' },
    { accessorKey: 'actualMinutes', header: ({ column }) => <DataTableColumnHeader column={column} title='Actual (min)' />, cell: ({ row }) => row.original.actualMinutes ?? '-' },
    { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />, cell: ({ row }) => <Badge className={statusBadge[row.original.status || ''] || ''}>{row.original.status || 'PENDING'}</Badge> },
  ]

  const compColumns: ColumnDef<WorkOrderComponent>[] = [
    { accessorKey: 'productId', header: ({ column }) => <DataTableColumnHeader column={column} title='Product' /> },
    { accessorKey: 'lotId', header: 'Lot', cell: ({ row }) => row.original.lotId || '-' },
    { accessorKey: 'quantityRequired', header: ({ column }) => <DataTableColumnHeader column={column} title='Req Qty' /> },
    { accessorKey: 'quantityConsumed', header: ({ column }) => <DataTableColumnHeader column={column} title='Consumed' />, cell: ({ row }) => row.original.quantityConsumed ?? '-' },
    { accessorKey: 'uomId', header: 'UOM' },
  ]

  const opTable = useReactTable({ data: wo?.operations || [], columns: opColumns, getCoreRowModel: getCoreRowModel() })
  const compTable = useReactTable({ data: wo?.components || [], columns: compColumns, getCoreRowModel: getCoreRowModel() })

  if (isLoading) return <div className='p-6'><Loader2 className='h-6 w-6 animate-spin' /></div>
  if (!wo) return <div className='p-6 text-muted-foreground'>Work order not found.</div>

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate({ to: '/work-orders' })}><ArrowLeft className='h-5 w-5' /></Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold'>{wo.workOrderNumber || `WO-${wo.id.slice(0, 8)}`}</h1>
            <Badge className={statusBadge[wo.status] || ''}>{wo.status?.replace(/_/g, ' ')}</Badge>
            {wo.priority && <Badge className={priorityBadge[wo.priority] || ''}>{wo.priority}</Badge>}
            <Badge variant='outline'>{wo.workOrderType?.replace(/_/g, ' ')}</Badge>
          </div>
        </div>
        <div className='flex gap-2'>
          {currentActions.map((a) => (
            <Button key={a} size='sm' variant={a === 'Cancel' ? 'destructive' : 'default'} onClick={() => handleAction(a)} disabled={release.isPending || complete.isPending || cancel.isPending}>
              {(release.isPending || complete.isPending || cancel.isPending) && <Loader2 className='mr-1 h-3 w-3 animate-spin' />}
              {a}
            </Button>
          ))}
        </div>
      </div>

      <div className='flex items-center gap-2 text-sm'>
        {['DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED'].map((s, i) => {
          const currentIdx = ['DRAFT', 'RELEASED', 'IN_PROGRESS', 'COMPLETED'].indexOf(wo.status === 'CANCELLED' ? 'COMPLETED' : wo.status)
          const isPast = i <= currentIdx
          const isCurrent = wo.status === s || (wo.status === 'CANCELLED' && s === 'COMPLETED')
          return (
            <div key={s} className='flex items-center gap-2'>
              {i > 0 && <div className={`h-px w-6 ${isPast ? 'bg-primary' : 'bg-muted'}`} />}
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${isCurrent ? (wo.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary') : isPast ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground/50'}`}>
                <div className={`h-2 w-2 rounded-full ${isCurrent ? (wo.status === 'CANCELLED' ? 'bg-red-500' : 'bg-primary') : isPast ? 'bg-muted-foreground' : 'bg-muted-foreground/30'}`} />
                {s.replace(/_/g, ' ')}
              </div>
            </div>
          )
        })}
        {wo.status === 'CANCELLED' && (
          <div className='flex items-center gap-2'>
            <div className='h-px w-6 bg-destructive' />
            <div className='flex items-center gap-1.5 rounded-full px-3 py-1 bg-red-100 text-red-700'>
              <div className='h-2 w-2 rounded-full bg-red-500' />
              CANCELLED
            </div>
          </div>
        )}
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Product</CardTitle></CardHeader><CardContent>{wo.productId || '-'}</CardContent></Card>
        <Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Quantity / UOM</CardTitle></CardHeader><CardContent>{wo.quantity ?? '-'} {wo.uomId || ''}</CardContent></Card>
        <Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Client</CardTitle></CardHeader><CardContent>{wo.clientId || '-'}</CardContent></Card>
        <Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Assigned To</CardTitle></CardHeader><CardContent>{wo.assignedToUserId || '-'}</CardContent></Card>
        <Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Scheduled</CardTitle></CardHeader><CardContent>{wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : '-'}</CardContent></Card>
        <Card><CardHeader className='pb-2'><CardTitle className='text-sm text-muted-foreground'>Created</CardTitle></CardHeader><CardContent>{wo.createdAt ? new Date(wo.createdAt).toLocaleDateString() : '-'}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Operations</CardTitle>
          {(wo.status === 'RELEASED' || wo.status === 'IN_PROGRESS') && (
            <Button size='sm' variant='outline' onClick={() => setOpOpen(true)}>Add Operation</Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>{opTable.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>
              {opTable.getRowModel().rows.length === 0 ? (
                <TableRow><TableCell colSpan={opColumns.length} className='text-center py-4 text-muted-foreground'>No operations defined.</TableCell></TableRow>
              ) : (
                opTable.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>Components</CardTitle>
          {(wo.status === 'RELEASED' || wo.status === 'IN_PROGRESS') && (
            <Button size='sm' variant='outline' onClick={() => setCompOpen(true)}>Add Component</Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>{compTable.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
            <TableBody>
              {compTable.getRowModel().rows.length === 0 ? (
                <TableRow><TableCell colSpan={compColumns.length} className='text-center py-4 text-muted-foreground'>No components added.</TableCell></TableRow>
              ) : (
                compTable.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OperationDialog open={opOpen} onOpenChange={setOpOpen} workOrderId={id} />
      <ComponentDialog open={compOpen} onOpenChange={setCompOpen} workOrderId={id} />
    </div>
  )
}
