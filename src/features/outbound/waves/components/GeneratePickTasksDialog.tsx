import { Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useGeneratePickTasks, useUpdateWaveStatus } from '../data/wave-queries'

interface GeneratePickTasksDialogProps {
  taskId: string
  taskLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GeneratePickTasksDialog({
  taskId,
  taskLabel,
  open,
  onOpenChange,
}: GeneratePickTasksDialogProps) {
  const generatePickTasks = useGeneratePickTasks()
  const updateWaveStatus = useUpdateWaveStatus()

  const handleGenerate = async () => {
    try {
      await generatePickTasks.mutateAsync(taskId)
      await updateWaveStatus.mutateAsync({ id: taskId, dto: { status: 'IN_PROGRESS' } })
      toast.success('Pick tasks generated successfully')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to generate pick tasks'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[440px]'>
        <DialogHeader>
          <DialogTitle>Generate Pick Tasks</DialogTitle>
          <DialogDescription>
            Create individual pick tasks from wave task {taskLabel || taskId.substring(0, 12)}.
            This will generate pick assignments for each order line item.
          </DialogDescription>
        </DialogHeader>
        <div className='flex items-center gap-3 rounded-md border p-4'>
          <Package className='h-8 w-8 text-muted-foreground' />
          <div className='text-sm'>
            <p className='font-medium'>Wave Task</p>
            <p className='text-muted-foreground font-mono text-xs'>
              {taskLabel || taskId.substring(0, 12) + '...'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generatePickTasks.isPending}>
            {generatePickTasks.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Generating...
              </>
            ) : (
              'Generate Pick Tasks'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
