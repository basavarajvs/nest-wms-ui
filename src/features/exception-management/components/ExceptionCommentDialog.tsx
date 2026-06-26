import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCommentList, useAddComment, type Comment } from '@/features/exception-management/data/exception-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  exceptionId: string
  exceptionType: string
}

const addCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
  isInternal: z.boolean().optional(),
})

type AddCommentFormValues = z.infer<typeof addCommentSchema>

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className='flex gap-3 rounded-lg border p-3'>
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted'>
        <User className='h-4 w-4 text-muted-foreground' />
      </div>
      <div className='flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>{comment.authorName || comment.authorId || 'Unknown'}</span>
          <span className='text-xs text-muted-foreground'>
            {new Date(comment.createdAt).toLocaleString()}
          </span>
          {comment.isInternal && (
            <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>Internal</Badge>
          )}
        </div>
        <p className='text-sm text-muted-foreground'>{comment.body}</p>
      </div>
    </div>
  )
}

export function ExceptionCommentDialog({ open, onOpenChange, exceptionId, exceptionType }: Props) {
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading, error, refetch } = useCommentList(exceptionId)
  const addComment = useAddComment()

  const form = useForm<AddCommentFormValues>({
    resolver: zodResolver(addCommentSchema),
    defaultValues: { body: '', isInternal: false },
  })

  const comments = data?.comments || []

  const onSubmit = async (values: AddCommentFormValues) => {
    try {
      await addComment.mutateAsync({ id: exceptionId, dto: { body: values.body, isInternal: values.isInternal || undefined } })
      toast.success('Comment added')
      form.reset()
      setShowForm(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add comment')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Comments — {exceptionType}
          </DialogTitle>
          <DialogDescription>
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-20 w-full' />)}
            </div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive text-sm'>Failed to load comments</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : comments.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>No comments yet.</p>
          ) : (
            comments.map((c) => <CommentItem key={c.id} comment={c} />)
          )}
        </div>

        {showForm ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 border-t pt-4'>
              <FormField control={form.control} name='body' render={({ field }) => (
                <FormItem><FormLabel>Comment</FormLabel><FormControl><Textarea {...field} placeholder='Write a comment...' rows={3} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='isInternal' render={({ field }) => (
                <FormItem className='flex items-center gap-2'>
                  <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className='!mt-0 text-sm font-normal'>Internal (visible only to staff)</FormLabel>
                </FormItem>
              )} />
              <div className='flex justify-end gap-2'>
                <Button type='button' variant='outline' size='sm' onClick={() => { setShowForm(false); form.reset() }}>Cancel</Button>
                <Button type='submit' size='sm' disabled={addComment.isPending}>
                  {addComment.isPending && <Loader2 className='mr-1 h-3 w-3 animate-spin' />}
                  Post Comment
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className='border-t pt-3'>
            <Button size='sm' variant='outline' onClick={() => setShowForm(true)}>
              <MessageSquare className='mr-2 h-4 w-4' />
              Add Comment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
