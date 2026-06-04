import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/dialogs/ConfirmDialog'
import {
  useReleaseHold,
  type Hold,
} from '@/features/inventory/holds/data/hold-queries'

const HOLD_TYPE_LABELS: Record<string, string> = {
  QA: 'QA Hold',
  DAMAGE: 'Damage Hold',
  CUSTOMER_HOLD: 'Customer Hold',
  CUSTOMER_REQUEST: 'Customer Request',
  DISPUTE: 'Dispute',
  QC_PENDING: 'QC Pending',
  QC_FAILED: 'QC Failed',
  QUARANTINE: 'Quarantine',
  CREDIT_HOLD: 'Credit Hold',
  OTHER: 'Other',
}

interface ReleaseHoldDialogProps {
  hold: Hold
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReleaseHoldDialog({ hold, open, onOpenChange }: ReleaseHoldDialogProps) {
  const [releaseNotes, setReleaseNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const releaseHold = useReleaseHold()

  const handleConfirmRelease = async () => {
    try {
      await releaseHold.mutateAsync({
        id: hold.id,
        dto: { notes: releaseNotes || undefined },
      })
      toast.success('Hold released successfully')
      setShowConfirm(false)
      onOpenChange(false)
      setReleaseNotes('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to release hold')
    }
  }

  return (
    <>
      <Dialog open={open && !showConfirm} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Release Hold</DialogTitle>
            <DialogDescription>
              Review the hold details before releasing
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {/* Hold Summary Card */}
            <div className='rounded-lg border p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>{hold.productName || hold.productId || '—'}</span>
                <Badge variant='outline'>{hold.productSku || ''}</Badge>
              </div>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>
                  <span className='text-xs text-muted-foreground'>Hold Type</span>
                  <p className='font-medium'>{HOLD_TYPE_LABELS[hold.holdType || ''] || hold.holdType || '—'}</p>
                </div>
                <div>
                  <span className='text-xs text-muted-foreground'>Quantity</span>
                  <p className='font-mono font-medium'>{hold.quantity ?? hold.qty ?? '—'}</p>
                </div>
                <div>
                  <span className='text-xs text-muted-foreground'>Reason</span>
                  <p className='text-muted-foreground'>{hold.reason || '—'}</p>
                </div>
                <div>
                  <span className='text-xs text-muted-foreground'>Created</span>
                  <p className='text-muted-foreground'>
                    {hold.createdAt ? new Date(hold.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              {hold.locationId && (
                <div className='text-xs text-muted-foreground'>
                  Location: <span className='font-mono'>{hold.locationId}</span>
                </div>
              )}
            </div>

            {/* Release Notes */}
            <div className='grid gap-2'>
              <Label htmlFor='releaseNotes'>Release Notes</Label>
              <Textarea
                id='releaseNotes'
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder='Optional notes about why this hold is being released...'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => setShowConfirm(true)}
              disabled={releaseHold.isPending}
            >
              {releaseHold.isPending ? 'Releasing...' : 'Release Hold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title='Release Hold'
        description={
          <div className='text-sm text-muted-foreground'>
            Are you sure you want to release this hold on{' '}
            <span className='font-medium text-foreground'>{hold.productName || hold.productId || 'this product'}</span>?
            {releaseNotes && (
              <p className='mt-2 italic'>Note: {releaseNotes}</p>
            )}
          </div>
        }
        confirmText='Yes, Release'
        isDestructive
        isLoading={releaseHold.isPending}
        onConfirm={handleConfirmRelease}
      />
    </>
  )
}
