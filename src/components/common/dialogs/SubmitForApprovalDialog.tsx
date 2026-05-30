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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface SubmitForApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onSubmit: (notes?: string) => Promise<void>
  submitText?: string
}

export function SubmitForApprovalDialog({
  open,
  onOpenChange,
  title = 'Submit for Approval',
  description = 'Add any notes for the approver before submitting.',
  onSubmit,
  submitText = 'Submit',
}: SubmitForApprovalDialogProps) {
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(notes || undefined)
      toast.success('Submitted for approval')
      setNotes('')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='grid gap-2'>
            <Label htmlFor='approval-notes'>Notes (optional)</Label>
            <Textarea
              id='approval-notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Add context for the approver...'
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='button' onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
