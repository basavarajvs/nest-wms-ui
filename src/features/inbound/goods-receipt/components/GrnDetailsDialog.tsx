import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DetailDialog } from '@/components/common/dialogs/DetailDialog'
import { useGrnLines } from '../data/grn-line-queries'
import { GrnDetailLineItemsTable } from './GrnDetailLineItemsTable'

function formatDateTime(d?: string): string {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return d }
}

function formatDate(d?: string): string {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

interface GrnDetailsDialogProps {
  grn: {
    id: string
    receiptNumber?: string
    status?: string
    facilityId?: string
    asnId?: string
    asnNumber?: string
    poNumber?: string
    supplier?: string
    receivedDate?: string
    createdAt?: string
    updatedAt?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  arrived: 'bg-blue-100 text-blue-700 border-blue-200',
  receiving: 'bg-purple-100 text-purple-700 border-purple-200',
  received: 'bg-green-100 text-green-700 border-green-200',
  inspecting: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export function GrnDetailsDialog({ grn, open, onOpenChange }: GrnDetailsDialogProps) {
  const { data: linesData, isLoading: linesLoading } = useGrnLines(grn.id)
  const lines = linesData?.lines ?? []

  const statusColor = grn.status
    ? STATUS_COLORS[grn.status.toLowerCase()] ?? 'bg-gray-100 text-gray-700 border-gray-200'
    : 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={grn.receiptNumber ? `GRN ${grn.receiptNumber}` : 'GRN Details'}
      description={grn.createdAt ? `Created ${formatDateTime(grn.createdAt)}` : undefined}
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Header Information</h3>
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-bold">{grn.receiptNumber ?? 'Unnumbered'}</h4>
            <Badge variant="outline" className={statusColor}>
              {grn.status
                ? grn.status.charAt(0).toUpperCase() + grn.status.slice(1)
                : 'Unknown'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">PO Number</p>
              <p className="mt-0.5 text-sm font-medium">{grn.poNumber || '-'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="mt-0.5 text-sm font-medium">{grn.supplier || '-'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">ASN Reference</p>
              <p className="mt-0.5 text-sm font-medium">{grn.asnNumber || (grn.asnId ? grn.asnId.slice(0, 8) + '...' : '-')}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Received Date</p>
              <p className="mt-0.5 text-sm font-medium">{formatDate(grn.receivedDate)}</p>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Line Items {linesLoading ? '' : `(${lines.length})`}
          </h3>
          {linesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <GrnDetailLineItemsTable lines={lines} />
          )}
        </div>
      </div>
    </DetailDialog>
  )
}
