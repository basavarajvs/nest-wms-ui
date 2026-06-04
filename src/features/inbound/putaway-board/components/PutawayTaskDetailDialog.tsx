import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DetailDialog } from '@/components/common/dialogs/DetailDialog'
import type { PutawayTask } from '../data/putaway-queries'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  on_hold: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium-Low',
  3: 'Medium',
  4: 'Medium-High',
  5: 'High',
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
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

interface PutawayTaskDetailDialogProps {
  task: PutawayTask
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PutawayTaskDetailDialog({
  task,
  open,
  onOpenChange,
}: PutawayTaskDetailDialogProps) {
  const status = task.status?.toLowerCase() ?? ''
  const statusColor = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const priorityLabel = PRIORITY_LABELS[task.priority ?? 0] ?? String(task.priority ?? '-')

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Putaway Task ${task.id ? task.id.slice(0, 8) + '...' : ''}`}
      description="Review task details and location guidance"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Task Information
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {task.id ?? '-'}
            </span>
            <Badge variant="outline" className={statusColor}>
              {(task.status ?? 'unknown').replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline">
              Priority: {task.priority ?? '-'} ({priorityLabel})
            </Badge>
          </div>
        </div>

        {/* Product Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Product
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Product Name" value={task.productName ?? task.productId ?? ''} />
            <InfoCard label="SKU" value={task.productSku ?? ''} />
            <InfoCard label="Expected Quantity" value={String(task.quantity ?? '-')} />
            <InfoCard label="GRN Reference" value={task.grnId ? task.grnId.slice(0, 8) + '...' : '-'} />
          </div>
        </div>

        {/* Location Guidance Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Location Guidance
          </h3>
          <div className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="mt-1 font-medium">
                {task.sourceLocationName ?? task.sourceLocationId ?? 'Receiving Dock'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="mt-1 font-medium">
                {task.suggestedLocationName ?? task.suggestedLocationId ?? '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Assignment
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="Assigned To"
              value={task.assignedToUserName ?? task.assignedToUserId ?? 'Unassigned'}
            />
            <InfoCard label="Created" value={formatDateTime(task.createdAt)} />
          </div>
        </div>
      </div>
    </DetailDialog>
  )
}
