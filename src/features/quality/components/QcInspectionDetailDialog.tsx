import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { QcStatusBadge } from '@/components/status-badges'
import { useQualityInspection } from '../data/quality-queries'

interface QcInspectionDetailDialogProps {
  inspectionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFECT_LABELS: Record<string, string> = {
  DAMAGED: 'Damaged',
  SHORT: 'Short',
  OVER: 'Over',
  WRONG_PRODUCT: 'Wrong Product',
  EXPIRED: 'Expired',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border p-3'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='mt-0.5 text-sm font-medium'>{value || '—'}</p>
    </div>
  )
}

function mapQcResult(val?: string): string {
  const raw = val?.toUpperCase() || 'PENDING'
  if (raw === 'PASS') return 'PASSED'
  if (raw === 'FAIL') return 'FAILED'
  return raw
}

export function QcInspectionDetailDialog({
  inspectionId,
  open,
  onOpenChange,
}: QcInspectionDetailDialogProps) {
  const { data: inspection, isLoading, error } = useQualityInspection(inspectionId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Inspection Detail</DialogTitle>
          <DialogDescription>
            {inspection && (
              <QcStatusBadge
                status={(mapQcResult(inspection.status || inspection.qcResult)) as any}
              />
            )}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : error || !inspection ? (
          <div className='py-8 text-center text-sm text-muted-foreground'>
            Failed to load inspection details.
          </div>
        ) : (
          <div className='grid gap-4'>
            <div className='grid grid-cols-2 gap-3'>
              <InfoRow label='Inspection ID' value={inspection.id} />
              <InfoRow label='GRN Line ID' value={inspection.grnLineId || ''} />
              <InfoRow label='Product' value={inspection.productName || inspection.productSku || ''} />
              <InfoRow label='Result' value={inspection.qcResult || inspection.status || ''} />
              <InfoRow label='Inspector' value={inspection.inspectorName || ''} />
              <InfoRow label='Date' value={
                inspection.inspectedAt || inspection.createdAt
                  ? new Date(inspection.inspectedAt || inspection.createdAt || '').toLocaleString()
                  : ''
              } />
            </div>

            {inspection.sampleSize != null && (
              <div className='grid grid-cols-3 gap-3'>
                <InfoRow label='Sample Size' value={String(inspection.sampleSize)} />
                <InfoRow label='Pass Count' value={String(inspection.passCount ?? '—')} />
                <InfoRow label='Fail Count' value={String(inspection.failCount ?? '—')} />
              </div>
            )}

            {inspection.defectTypes && inspection.defectTypes.length > 0 && (
              <div className='space-y-2'>
                <p className='text-sm font-semibold'>Defect Types</p>
                <div className='flex flex-wrap gap-2'>
                  {inspection.defectTypes.map((dt) => (
                    <Badge key={dt} variant='destructive'>
                      {DEFECT_LABELS[dt] || dt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {inspection.notes && (
              <div className='rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground'>Notes</p>
                <p className='mt-0.5 whitespace-pre-wrap text-sm'>{inspection.notes}</p>
              </div>
            )}

            {inspection.photoUrls && inspection.photoUrls.length > 0 && (
              <div className='space-y-2'>
                <p className='text-sm font-semibold'>Photo Evidence ({inspection.photoUrls.length})</p>
                <div className='flex flex-wrap gap-2'>
                  {inspection.photoUrls.map((url, i) => (
                    <div key={i} className='h-20 w-20 overflow-hidden rounded-md border'>
                      <img
                        src={url}
                        alt={`Evidence ${i + 1}`}
                        className='h-full w-full object-cover'
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
