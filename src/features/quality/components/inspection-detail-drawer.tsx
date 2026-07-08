import { useState } from 'react'
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
  useInspectionById,
  useInspectionDefects,
  useApproveInspection,
  useRejectInspection,
  INSPECTION_STATUS_LABELS,
} from '@/features/quality/data/inspection-queries'
import { DataTableLoading } from '@/components/data-table/data-table'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InspectionDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inspectionId: string | null
}

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'PENDING_REVIEW':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'PASSED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

const SUPERVISOR_ROLES = ['WAREHOUSE_SUPERVISOR', 'WAREHOUSE_ADMIN', 'SYSTEM_ADMIN', 'TENANT_ADMIN']

export function InspectionDetailDrawer({ open, onOpenChange, inspectionId }: InspectionDetailDrawerProps) {
  const { data: inspection, isLoading } = useInspectionById(inspectionId)
  const { data: defects = [] } = useInspectionDefects(inspectionId)
  const approveMutation = useApproveInspection()
  const rejectMutation = useRejectInspection()

  const user = useAuthStore((s) => s.user)
  const canApproveOrReject = user?.roles?.some((r) => SUPERVISOR_ROLES.includes(r)) ?? false

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const isPendingReview = inspection?.status === 'PENDING_REVIEW'
  const isActionLoading = approveMutation.isPending || rejectMutation.isPending

  const handleApprove = () => {
    if (!inspectionId) return
    approveMutation.mutate(
      { id: inspectionId },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  const handleReject = () => {
    if (!inspectionId) return
    rejectMutation.mutate(inspectionId, {
      onSuccess: () => {
        setRejectDialogOpen(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Inspection #{inspection?.inspection_number ?? inspection?.inspection_id ?? ''}</SheetTitle>
            <SheetDescription>
              Quality inspection details and results
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <DataTableLoading />
          ) : !inspection ? (
            <p className="text-sm text-muted-foreground py-4">Inspection not found.</p>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Inspection #: </span>
                  <span className="font-medium">{inspection.inspection_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge className={statusBadgeClass(inspection.status)}>
                    {INSPECTION_STATUS_LABELS[inspection.status] ?? inspection.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  {inspection.inspection_type ?? '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Product: </span>
                  {inspection.product_name ?? `Product #${inspection.product_id}`}
                </div>
                <div>
                  <span className="text-muted-foreground">Reference: </span>
                  {inspection.reference_type ? `${inspection.reference_type} #${inspection.reference_id}` : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {inspection.created_at ? new Date(inspection.created_at).toLocaleString() : '-'}
                </div>
              </div>

              {inspection.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  {inspection.notes}
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Findings / Defects ({defects.length})</h4>
                {defects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Defect Code</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defects.map((defect) => (
                        <TableRow key={defect.defect_id}>
                          <TableCell className="font-medium">#{defect.defect_code_id}</TableCell>
                          <TableCell>{defect.quantity_affected ?? '-'}</TableCell>
                          <TableCell className="max-w-40 truncate">{defect.notes ?? '-'}</TableCell>
                          <TableCell>{defect.recorded_by ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No defects recorded for this inspection.</p>
                )}
              </div>
            </div>
          )}

          <SheetFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {isPendingReview && canApproveOrReject && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isActionLoading}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isActionLoading}
                >
                  Approve
                </Button>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Inspection</DialogTitle>
            <DialogDescription>
              This will reject the inspection and may trigger a new inspection cycle. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActionLoading}>
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
