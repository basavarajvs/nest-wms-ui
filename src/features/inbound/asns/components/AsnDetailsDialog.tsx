import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DetailDialog } from '@/components/common/dialogs/DetailDialog'
import { useAsnDetail } from '../data/asn-queries'
import { AsnDetailLineItemsTable } from './AsnDetailLineItemsTable'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  in_transit: 'bg-purple-100 text-purple-700 border-purple-200',
  received: 'bg-green-100 text-green-700 border-green-200',
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
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

function formatDate(d?: string): string {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}

interface AsnDetailsDialogProps {
  asnId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
}

export function AsnDetailsDialog({
  asnId,
  open,
  onOpenChange,
}: AsnDetailsDialogProps) {
  const { data: detail, isLoading } = useAsnDetail(asnId)

  const statusColor = detail?.status
    ? STATUS_COLORS[detail.status.toLowerCase()] ?? 'bg-gray-100 text-gray-700 border-gray-200'
    : 'bg-gray-100 text-gray-700 border-gray-200'

  const lines = useMemo(() => (detail?.lines ?? []) as any[], [detail?.lines])
  const statusHistory = detail?.statusHistory ?? []

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={detail ? `ASN ${detail.asnNumber ?? detail.id}` : 'ASN Details'}
      description={detail ? `Created ${formatDateTime(detail.createdAt)}` : undefined}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : detail ? (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Header Information
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-lg font-bold">
                {detail.asnNumber ?? 'Unnumbered'}
              </h4>
              <Badge variant="outline" className={statusColor}>
                {detail.status
                  ? detail.status.charAt(0).toUpperCase() + detail.status.slice(1)
                  : 'Unknown'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="PO Number" value={detail.poNumber ?? ''} />
              <InfoCard label="Created By" value={detail.createdBy ?? ''} />
            </div>
          </div>

          {/* Vendor / Shipping Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Vendor & Shipping
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Vendor" value={detail.vendorName ?? detail.supplier ?? ''} />
              <InfoCard label="Carrier" value={detail.carrierName ?? ''} />
              <InfoCard label="Tracking Number" value={detail.trackingNumber ?? ''} />
              <InfoCard label="Expected Arrival" value={formatDate(detail.expectedDate)} />
              {detail.notes && (
                <div className="col-span-2 rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="mt-0.5 text-sm">{detail.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Line Items ({lines.length})
            </h3>
            <AsnDetailLineItemsTable lines={lines} />
          </div>

          {/* Timeline / Audit Section */}
          {(statusHistory ?? []).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Status History
              </h3>
              <div className="space-y-2">
                {statusHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="flex size-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex flex-1 items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="font-medium">{entry.from ?? '?'}</span>
                        {' → '}
                        <span className="font-medium">{entry.to ?? '?'}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.changedAt)}
                        {entry.changedBy && ` by ${entry.changedBy}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          ASN not found.
        </p>
      )}
    </DetailDialog>
  )
}
