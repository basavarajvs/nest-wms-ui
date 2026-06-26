import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createInspectionResultSchema } from '@/features/quality/inspections/data/inspection-schemas'
import { useSubmitInspectionResult } from '@/features/quality/inspections/data/inspection-queries'
import type * as z from 'zod'

interface Props {
  inspectionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormValues = z.infer<typeof createInspectionResultSchema>

export function InspectionResultDialog({ inspectionId, open, onOpenChange }: Props) {
  const submitResult = useSubmitInspectionResult()

  const form = useForm<FormValues>({
    resolver: zodResolver(createInspectionResultSchema),
    defaultValues: {
      checkType: 'VISUAL',
      result: 'PASS',
      notes: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await submitResult.mutateAsync({
        id: inspectionId,
        dto: {
          ...values,
          mediaUrl: values.mediaUrl || undefined,
        },
      })
      toast.success('Result recorded')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to record result')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Record Inspection Result</DialogTitle>
          <DialogDescription>Document a check point for this inspection</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='checkType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='VISUAL'>Visual</SelectItem>
                      <SelectItem value='DIMENSIONAL'>Dimensional</SelectItem>
                      <SelectItem value='WEIGHT'>Weight</SelectItem>
                      <SelectItem value='COUNT'>Count</SelectItem>
                      <SelectItem value='LABEL'>Label</SelectItem>
                      <SelectItem value='DOCUMENT'>Document</SelectItem>
                      <SelectItem value='TEST'>Test</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='result'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Result</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='PASS'>Pass</SelectItem>
                      <SelectItem value='FAIL'>Fail</SelectItem>
                      <SelectItem value='N/A'>N/A</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='measuredValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measured Value</FormLabel>
                    <FormControl>
                      <Input type='number' step='any' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='toleranceMin'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tolerance Min</FormLabel>
                    <FormControl>
                      <Input type='number' step='any' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='toleranceMax'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tolerance Max</FormLabel>
                    <FormControl>
                      <Input type='number' step='any' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='mediaUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Media URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='https://...' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={submitResult.isPending}>
                {submitResult.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Record
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
