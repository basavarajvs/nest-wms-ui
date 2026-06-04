import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DetailDialog } from '@/components/common/dialogs/DetailDialog'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useOrderLines, type OrderLine } from '../data/order-line-queries'
import type { Order } from '../data/order-queries'

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-700 border-blue-200',
  validated: 'bg-purple-100 text-purple-700 border-purple-200',
  allocated: 'bg-orange-100 text-orange-700 border-orange-200',
  released: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  picked: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  packed: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  shipped: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '-'}</p>
    </div>
  )
}

function formatDateTime(d?: string): string {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

function formatDate(d?: string): string {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  const barColor =
    pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : pct > 0 ? 'bg-yellow-500' : 'bg-gray-200'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface SalesOrderDetailsDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesOrderDetailsDialog({ order, open, onOpenChange }: SalesOrderDetailsDialogProps) {
  const { data: linesData, isLoading: linesLoading } = useOrderLines(order.id)
  const lines: OrderLine[] = linesData?.lines ?? []

  const statusColor = order.status
    ? STATUS_COLORS[order.status.toLowerCase()] ?? 'bg-gray-100 text-gray-700 border-gray-200'
    : 'bg-gray-100 text-gray-700 border-gray-200'

  const totalQty = useMemo(() => lines.reduce((s, l) => s + (l.quantity || 0), 0), [lines])
  const totalAllocated = useMemo(() => lines.reduce((s, l) => s + (l.allocatedQuantity || 0), 0), [lines])
  const totalPicked = useMemo(() => lines.reduce((s, l) => s + (l.pickedQuantity || 0), 0), [lines])
  const totalPacked = useMemo(() => lines.reduce((s, l) => s + (l.packedQuantity || 0), 0), [lines])
  const totalShipped = useMemo(() => lines.reduce((s, l) => s + (l.shippedQuantity || 0), 0), [lines])

  const allocatedPct = totalQty > 0 ? (totalAllocated / totalQty) * 100 : 0
  const pickedPct = totalQty > 0 ? (totalPicked / totalQty) * 100 : 0
  const packedPct = totalQty > 0 ? (totalPacked / totalQty) * 100 : 0
  const shippedPct = totalQty > 0 ? (totalShipped / totalQty) * 100 : 0

  const grandTotal = useMemo(
    () => lines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0),
    [lines]
  )

  const columns: ColumnDef<OrderLine, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Product" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.productName || row.original.productSku || row.original.productId}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Qty Ordered" />
        ),
        cell: ({ row }) => <span className="font-mono">{row.original.quantity}</span>,
      },
      {
        accessorKey: 'allocatedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Allocated" />
        ),
        cell: ({ row }) => <span className="font-mono">{row.original.allocatedQuantity ?? 0}</span>,
      },
      {
        accessorKey: 'pickedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Picked" />
        ),
        cell: ({ row }) => <span className="font-mono">{row.original.pickedQuantity ?? 0}</span>,
      },
      {
        accessorKey: 'packedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Packed" />
        ),
        cell: ({ row }) => <span className="font-mono">{row.original.packedQuantity ?? 0}</span>,
      },
      {
        id: 'shippedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Shipped" />
        ),
        cell: ({ row }) => <span className="font-mono">{row.original.shippedQuantity ?? 0}</span>,
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="UOM" />
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Unit Price" />
        ),
        cell: ({ row }) => <span className="font-mono">${(row.original.unitPrice || 0).toFixed(2)}</span>,
      },
      {
        id: 'lineTotal',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Line Total" />
        ),
        cell: ({ row }) => {
          const total = (row.original.quantity || 0) * (row.original.unitPrice || 0)
          return <span className="font-mono font-medium">${total.toFixed(2)}</span>
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={order.orderNumber ? `Order ${order.orderNumber}` : 'Order Details'}
      description={order.createdAt ? `Created ${formatDateTime(order.createdAt)}` : undefined}
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Header Information</h3>
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-bold">{order.orderNumber ?? order.id.slice(0, 12) + '...'}</h4>
            <Badge variant="outline" className={statusColor}>
              {order.status
                ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                : 'Unknown'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Client" value={order.clientCode ?? ''} />
            <InfoCard label="Priority" value={order.priority != null ? String(order.priority) : '-'} />
            <InfoCard label="Order Type" value={order.orderType ?? ''} />
            <InfoCard label="Created Date" value={formatDate(order.createdAt)} />
          </div>
        </div>

        {/* Fulfillment Progress */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Fulfillment Progress</h3>
          <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
            {linesLoading ? (
              <div className="col-span-2 flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : lines.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground">No line items loaded.</p>
            ) : (
              <>
                <ProgressBar label="Allocated" pct={allocatedPct} />
                <ProgressBar label="Picked" pct={pickedPct} />
                <ProgressBar label="Packed" pct={packedPct} />
                <ProgressBar label="Shipped" pct={shippedPct} />
              </>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Line Items {linesLoading ? '' : `(${lines.length})`}
          </h3>
          {linesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">No line items found.</p>
          ) : (
            <div className="rounded-md border">
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
          )}
          {!linesLoading && lines.length > 0 && (
            <div className="flex justify-end rounded-md bg-muted px-4 py-2 text-sm">
              <span className="font-medium">
                Grand Total: <span className="font-mono">${grandTotal.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Delivery Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Delivery Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Delivery Address" value={(order as any).deliveryAddress ?? '-'} />
            <InfoCard label="Requested Delivery Date" value={formatDate(order.requestedDeliveryDate)} />
            <InfoCard label="Actual Ship Date" value={(order as any).actualShipDate ?? '-'} />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Timeline</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <div className="size-2 shrink-0 rounded-full bg-blue-500" />
              <div className="flex flex-1 items-center justify-between gap-2 text-sm">
                <span className="font-medium">Order Created</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </span>
              </div>
            </div>
            {order.status && order.status.toLowerCase() !== 'created' && (
              <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                <div className="size-2 shrink-0 rounded-full bg-green-500" />
                <div className="flex flex-1 items-center justify-between gap-2 text-sm">
                  <span>
                    Status updated to{' '}
                    <span className="font-medium">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {order.requestedDeliveryDate ? formatDate(order.requestedDeliveryDate) : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DetailDialog>
  )
}
