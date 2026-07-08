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
import { useGrnById, usePutawayTasksByGrn, GRN_STATUS_LABELS } from '@/features/inbound/data/grn-queries'
import { DataTableLoading } from '@/components/data-table/data-table'
import { Loader2Icon } from 'lucide-react'
import type { GoodsReceiptItemDto } from '@/lib/wms-api/types/wms-api'

interface GrnDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  grnId: string | null
}

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'IN_PROGRESS':
    case 'IN_RECEIVING':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'PARTIALLY_RECEIVED':
    case 'RECEIVED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

export function GrnDetailDrawer({ open, onOpenChange, grnId }: GrnDetailDrawerProps) {
  const navigate = useNavigate()
  const { data: grn, isLoading } = useGrnById(grnId)
  const { data: putawayTasks = [], isLoading: putawayLoading } = usePutawayTasksByGrn(
    grn?.receipt_number ?? null,
  )

  const items = useMemo(() => {
    if (!grn) return []
    return (grn.items ?? []) as GoodsReceiptItemDto[]
  }, [grn])

  const lines = useMemo(() => {
    if (!grn) return []
    return grn.lines ?? []
  }, [grn])

  const displayItems = items.length > 0 ? items : null

  const totalQtyReceived = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>GRN #{grn?.receipt_number ?? ''}</SheetTitle>
          <SheetDescription>
            Goods Receipt Note details and received items
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <DataTableLoading />
        ) : !grn ? (
          <p className="text-sm text-muted-foreground py-4">GRN not found.</p>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Receipt Number: </span>
                <span className="font-medium">{grn.receipt_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <Badge className={statusBadgeClass(grn.status)}>
                  {GRN_STATUS_LABELS[grn.status] ?? grn.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">ASN: </span>
                {grn.asn_number ?? '-'}
              </div>
              <div>
                <span className="text-muted-foreground">PO: </span>
                {grn.po_number ?? '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Vendor: </span>
                {grn.vendor_name ?? '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Client: </span>
                {grn.client_name ?? '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Received Date: </span>
                {grn.received_date ?? '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Facility: </span>
                {grn.facility_name ?? '-'}
              </div>
            </div>

            {grn.notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes: </span>
                {grn.notes}
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Received Items</h4>
              {displayItems ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Lot #</TableHead>
                      <TableHead>Condition</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayItems.map((item) => (
                      <TableRow key={item.receipt_item_id}>
                        <TableCell className="font-medium">{item.product_name ?? `Product #${item.product_id}`}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.uom_name ?? '-'}</TableCell>
                        <TableCell>{item.location_name ?? '-'}</TableCell>
                        <TableCell>{item.lot_number ?? '-'}</TableCell>
                        <TableCell>{item.condition_status ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                    {displayItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No items found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Lot #</TableHead>
                      <TableHead>Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.receipt_line_id}>
                        <TableCell className="font-medium">{`Line #${line.receipt_line_id}`}</TableCell>
                        <TableCell>{line.expected_quantity}</TableCell>
                        <TableCell>{line.received_quantity}</TableCell>
                        <TableCell>{line.uom_name ?? '-'}</TableCell>
                        <TableCell>{line.lot_number ?? '-'}</TableCell>
                        <TableCell>{line.variance_type ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                    {lines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No lines found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {items.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total items: {items.length} | Total qty: {totalQtyReceived}
              </div>
            )}

            {grn.qc_required && (
              <div className="text-sm border rounded-md p-3">
                <span className="font-medium">QC Summary: </span>
                {grn.qc_result ? (
                  <span>Result: {grn.qc_result}</span>
                ) : (
                  <span className="text-muted-foreground">QC required - pending inspection</span>
                )}
                {grn.qc_failure_reason && (
                  <span className="text-destructive ml-2">Failure: {grn.qc_failure_reason}</span>
                )}
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">
                Putaway Tasks
                {putawayLoading && <Loader2Icon className="inline-block h-3 w-3 animate-spin ml-1" />}
              </h4>
              {putawayTasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {putawayTasks.map((task) => (
                      <TableRow key={(task as unknown as { putaway_task_id?: number }).putaway_task_id}>
                        <TableCell>{(task as unknown as { task_number?: string }).task_number ?? '-'}</TableCell>
                        <TableCell>{(task as unknown as { product_name?: string }).product_name ?? '-'}</TableCell>
                        <TableCell>{(task as unknown as { quantity?: number }).quantity ?? '-'}</TableCell>
                        <TableCell>{(task as unknown as { status?: string }).status ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : !putawayLoading ? (
                <p className="text-sm text-muted-foreground">No putaway tasks found for this GRN.</p>
              ) : null}
            </div>
          </div>
        )}

        <SheetFooter className="border-t pt-4 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              navigate({ to: '/inbound/putaway' })
            }}
          >
            View Putaway Tasks
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
