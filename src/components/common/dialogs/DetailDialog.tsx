import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  closeText?: string
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  closeText = 'Close',
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className='space-y-4 py-2'>{children}</div>

        <div className='flex justify-end pt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            {closeText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
