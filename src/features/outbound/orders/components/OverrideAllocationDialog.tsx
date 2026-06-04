import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useOverrideAllocation } from '../data/order-queries'

interface OverrideAllocationDialogProps {
  orderId: string
  orderNumber?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OverrideAllocationDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: OverrideAllocationDialogProps) {
  const [allocationId, setAllocationId] = useState('')
  const [reason, setReason] = useState('')
  const [substituteLocationId, setSubstituteLocationId] = useState('')
  const [substituteLotId, setSubstituteLotId] = useState('')
  const overrideMutation = useOverrideAllocation()

  const handleSubmit = async () => {
    if (!allocationId) {
      toast.error('Allocation ID is required.')
      return
    }
    if (!reason) {
      toast.error('Reason is required.')
      return
    }
    if (!substituteLocationId) {
      toast.error('Substitute location ID is required.')
      return
    }
    try {
      await overrideMutation.mutateAsync({
        allocationId,
        reason,
        substituteLocationId,
        substituteLotId: substituteLotId || '',
      })
      toast.success('Allocation overridden successfully')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to override allocation')
    }
  }

  const handleClose = () => {
    if (!overrideMutation.isPending) {
      setAllocationId('')
      setReason('')
      setSubstituteLocationId('')
      setSubstituteLotId('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Override Allocation</DialogTitle>
          <DialogDescription>
            Override the allocation for order {orderNumber || orderId}.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='allocationId'>Allocation ID</Label>
            <Input
              id='allocationId'
              value={allocationId}
              onChange={(e) => setAllocationId(e.target.value)}
              placeholder='Enter the allocation ID to override'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='reason'>Reason</Label>
            <Textarea
              id='reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder='Why is this allocation being overridden?'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='substituteLocationId'>Substitute Location ID</Label>
            <Input
              id='substituteLocationId'
              value={substituteLocationId}
              onChange={(e) => setSubstituteLocationId(e.target.value)}
              placeholder='e.g. LOC-A-01'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='substituteLotId'>Substitute Lot ID</Label>
            <Input
              id='substituteLotId'
              value={substituteLotId}
              onChange={(e) => setSubstituteLotId(e.target.value)}
              placeholder='Optional lot ID'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={overrideMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={overrideMutation.isPending}>
            {overrideMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
