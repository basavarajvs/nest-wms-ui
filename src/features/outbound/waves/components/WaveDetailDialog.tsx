import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { WaveStatusBadge } from '@/components/status-badges'
import type { WaveTask } from '../data/wave-queries'
import type { WaveStatus } from '@/types/warehouse-statuses'

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border p-3'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-0.5 text-sm font-medium'>{value || '-'}</p>
    </div>
  )
}

function formatDateTime(d?: string): string {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

interface WaveDetailDialogProps {
  task: WaveTask
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaveDetailDialog({ task, open, onOpenChange }: WaveDetailDialogProps) {
  const columns: ColumnDef<WaveTask, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Task ID' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.original.id ? row.original.id.substring(0, 12) + '...' : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'orderId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Order' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.orderId ? row.original.orderId.substring(0, 12) + '...' : '—'}</span>
        ),
      },
      {
        accessorKey: 'productId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.productId ? row.original.productId.substring(0, 12) + '...' : '—'}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Qty' />,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => (
          <WaveStatusBadge
            status={
              ((row.getValue('status') as string) || '').toUpperCase().replace('IN_PROGRESS', 'IN_PROGRESS') as WaveStatus
            }
          />
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: [task],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Wave Task Detail</DialogTitle>
          <DialogDescription>
            {task.createdAt ? `Created ${formatDateTime(task.createdAt)}` : 'Wave task information'}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6 py-2'>
          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-muted-foreground'>Task Information</h3>
            <div className='flex flex-wrap items-center gap-3'>
              <h4 className='text-sm font-medium'>
                {task.id ? task.id.substring(0, 12) + '...' : 'Unnamed'}
              </h4>
              <Badge variant='outline'>
                {task.status
                  ? task.status.charAt(0).toUpperCase() + task.status.slice(1)
                  : 'Unknown'}
              </Badge>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <InfoCard label='Order ID' value={task.orderId ?? ''} />
              <InfoCard label='Product ID' value={task.productId ?? ''} />
              <InfoCard label='Quantity' value={task.quantity != null ? String(task.quantity) : '-'} />
              <InfoCard label='Assigned To' value={task.assignedToUserId ?? ''} />
            </div>
          </div>

          <div className='space-y-3'>
            <h3 className='text-sm font-semibold text-muted-foreground'>Task Details</h3>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id}>
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
          </div>
        </div>
        <div className='flex justify-end pt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
