
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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

const overrideSchema = z.object({
  substituteLocationId: z.string().min(1, 'Substitute location is required'),
  substituteLotId: z.string().optional(),
  reason: z.string().min(1, 'Reason is required'),
})

type OverrideForm = z.infer<typeof overrideSchema>

interface OverrideAllocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allocationId: string
  onSubmit: (data: OverrideForm) => Promise<void>
  isSubmitting?: boolean
}

export function OverrideAllocationDialog({
  open,
  onOpenChange,
  allocationId,
  onSubmit,
  isSubmitting = false,
}: OverrideAllocationDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OverrideForm>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      substituteLocationId: '',
      substituteLotId: '',
      reason: '',
    },
  })

  const handleFormSubmit = async (data: OverrideForm) => {
    try {
      await onSubmit(data)
      toast.success('Allocation overridden successfully')
      reset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to override allocation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override Allocation</DialogTitle>
          <DialogDescription>
            Override allocation {allocationId.substring(0, 12)}... with a substitute location or lot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 py-2'>
          <div className='grid gap-2'>
            <Label htmlFor='substituteLocationId'>Substitute Location *</Label>
            <Input
              id='substituteLocationId'
              {...register('substituteLocationId')}
              placeholder='location-uuid'
            />
            {errors.substituteLocationId && (
              <p className='text-sm text-destructive'>{errors.substituteLocationId.message}</p>
            )}
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='substituteLotId'>Substitute Lot (optional)</Label>
            <Input
              id='substituteLotId'
              {...register('substituteLotId')}
              placeholder='lot-uuid'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='reason'>Reason *</Label>
            <Textarea
              id='reason'
              {...register('reason')}
              placeholder='Why is this override needed?'
              rows={2}
            />
            {errors.reason && (
              <p className='text-sm text-destructive'>{errors.reason.message}</p>
            )}
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
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Overriding...' : 'Override'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
