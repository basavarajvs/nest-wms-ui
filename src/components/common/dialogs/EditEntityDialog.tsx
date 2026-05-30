import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EditEntityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  isSubmitting?: boolean
  onSubmit?: () => void
  submitText?: string
  cancelText?: string
}

export function EditEntityDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  isSubmitting = false,
  onSubmit,
  submitText = 'Save Changes',
  cancelText = 'Cancel',
}: EditEntityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className='space-y-4 py-2'>{children}</div>

        <div className='flex justify-end gap-2 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
          {onSubmit && (
            <Button type='button' onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : submitText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
