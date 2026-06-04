import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Form } from '@/components/ui/form'
import { UserSelect } from '@/components/common/forms/UserSelect'
import { useAssignPutawayTask } from '../data/putaway-queries'

const assignSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
})

type AssignForm = z.infer<typeof assignSchema>

interface AssignUserDialogProps {
  taskId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignUserDialog({ taskId, open, onOpenChange }: AssignUserDialogProps) {
  const assignTask = useAssignPutawayTask()
  const form = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: { userId: '' },
  })

  const handleSubmit = async (values: AssignForm) => {
    try {
      await assignTask.mutateAsync({ id: taskId, assignedToUserId: values.userId })
      toast.success('Task assigned successfully')
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign task')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Assign Putaway Task</DialogTitle>
              <DialogDescription>
                Select a user to assign this putaway task to
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <UserSelect
                control={form.control}
                name="userId"
                label="User"
                placeholder="Select warehouse user..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignTask.isPending}>
                {assignTask.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
