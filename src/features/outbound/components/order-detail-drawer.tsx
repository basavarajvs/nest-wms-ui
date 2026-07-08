import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import {
  useOrderById,
  useOrderAllocations,
  useOrderPickingTasks,
  useAllocateOrder,
  ORDER_STATUS_LABELS,
} from '@/features/outbound/data/order-queries'
import { DataTableLoading } from '@/components/data-table/data-table'
import { useFacilityStore } from '@/stores/facility-store'
import { Loader2Icon } from 'lucide-react'
import type { OrderLineDto } from '@/lib/wms-api/types/wms-api'

interface OrderDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string | null
}

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'ALLOCATED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'PICKING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'PACKED':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'SHIPPED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export function OrderDetailDrawer({ open, onOpenChange, orderId }: OrderDetailDrawerProps) {
  const navigate = useNavigate()
  const facilityId = useFacilityStore((s) => s.facilityId)
  const { data: order, isLoading } = useOrderById(orderId)
  const { data: allocations = [] } = useOrderAllocations(orderId)
  const { data: pickingTasks, isLoading: pickingLoading } = useOrderPickingTasks(orderId)
  const allocateMutation = useAllocateOrder()

  const lines = useMemo(() => {
    if (!order?.lines) return [] as OrderLineDto[]
    return (order.lines as unknown as OrderLineDto[]).filter(Boolean) ?? []
  }, [order])

  const totalOrdered = useMemo(() => lines.reduce((s, l) => s + l.requested_quantity, 0), [lines])
  const totalFulfilled = useMemo(() => lines.reduce((s, l) => s + (l.fulfilled_quantity ?? 0), 0), [lines])
  const totalAllocated = useMemo(() => allocations.reduce((s, a) => s + a.quantity_allocated, 0), [allocations])

  const isNew = order?.status === 'NEW'
  const isAllocated = order?.status === 'ALLOCATED'
  const canAllocate = isNew && !!facilityId

  const handleAllocate = () => {
    if (!orderId || !facilityId) return
    allocateMutation.mutate({ order_id: orderId, facility_id: String(facilityId) })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order #{order?.order_number ?? ''}</SheetTitle>
          <SheetDescription>
            Sales order details, lines, and allocation status
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <DataTableLoading />
        ) : !order ? (
          <p className="text-sm text-muted-foreground py-4">Order not found.</p>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Order #: </span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <Badge className={statusBadgeClass(order.status)}>
                  {ORDER_STATUS_LABELS[order.status ?? ''] ?? order.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Customer: </span>
                {order.customer_name ?? '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Order Date: </span>
                {order.order_date ? new Date(order.order_date).toLocaleDateString() : '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Priority: </span>
                {order.priority != null ? `P${order.priority}` : '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Value: </span>
                {order.total_order_value != null
                  ? `${order.currency_code ?? ''} ${Number(order.total_order_value).toFixed(2)}`
                  : '-'}
              </div>
            </div>

            {order.notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes: </span>
                {order.notes}
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Order Lines ({lines.length})</h4>
              {lines.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Fulfilled</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.line_id}>
                        <TableCell className="text-muted-foreground">{line.line_number}</TableCell>
                        <TableCell className="font-medium">{line.product_name ?? `Product #${line.product_id}`}</TableCell>
                        <TableCell className="tabular-nums">{line.requested_quantity}</TableCell>
                        <TableCell className="tabular-nums">{line.allocated_quantity ?? 0}</TableCell>
                        <TableCell className="tabular-nums">{line.fulfilled_quantity ?? 0}</TableCell>
                        <TableCell className="tabular-nums">{line.remaining_quantity ?? '-'}</TableCell>
                        <TableCell className="tabular-nums">{line.unit_price != null ? Number(line.unit_price).toFixed(2) : '-'}</TableCell>
                        <TableCell>
                          {line.status ? (
                            <Badge variant="outline" className={statusBadgeClass(line.status)}>
                              {line.status}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No lines found.</p>
              )}
              <div className="text-sm text-muted-foreground mt-2">
                Total ordered: {totalOrdered} | Fulfilled: {totalFulfilled}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Allocations ({allocations.length})</h4>
              {allocations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Lot #</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((alloc) => (
                      <TableRow key={alloc.allocation_id}>
                        <TableCell className="font-medium">{alloc.product_name ?? `Product #${alloc.product_id}`}</TableCell>
                        <TableCell className="tabular-nums">{alloc.quantity_allocated}</TableCell>
                        <TableCell className="text-sm font-mono">{alloc.location_name ?? '-'}</TableCell>
                        <TableCell className="text-sm">{alloc.lot_number ?? '-'}</TableCell>
                        <TableCell>{alloc.status ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No allocations recorded yet.</p>
              )}
              {allocations.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Total allocated: {totalAllocated} | Lines: {allocations.length}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                Picking Tasks
                {pickingLoading && <Loader2Icon className="inline-block h-3 w-3 animate-spin ml-1" />}
              </h4>
              {pickingTasks && pickingTasks.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pickingTasks.data.map((task, idx) => (
                      <TableRow key={(task as unknown as { picking_task_id?: string }).picking_task_id ?? idx}>
                        <TableCell>{(task as unknown as { task_number?: string }).task_number ?? `Task #${idx + 1}`}</TableCell>
                        <TableCell>{(task as unknown as { status?: string }).status ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : pickingTasks && pickingTasks.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No picking tasks created yet.</p>
              ) : null}
            </div>
          </div>
        )}

        <SheetFooter className="border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            {canAllocate && (
              <Button
                variant="secondary"
                onClick={handleAllocate}
                disabled={allocateMutation.isPending}
              >
                {allocateMutation.isPending ? (
                  <><Loader2Icon className="h-4 w-4 animate-spin mr-1" /> Allocating...</>
                ) : (
                  'Allocate Inventory'
                )}
              </Button>
            )}
            {(isNew || isAllocated) && (
              <Button
                onClick={() => {
                  onOpenChange(false)
                  navigate({ to: '/outbound/waves' })
                }}
              >
                Initiate Wave
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
