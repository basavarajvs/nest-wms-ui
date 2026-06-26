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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAuditSchema, updateAuditSchema } from '@/features/quality/compliance/data/compliance-schemas'
import { useCreateAudit, useUpdateAudit, useRequirementList } from '@/features/quality/compliance/data/compliance-queries'
import { useFacility } from '@/hooks/useFacility'
import type * as z from 'zod'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  audit?: { id: string; status: string }
}

type CreateFormValues = z.infer<typeof createAuditSchema>
type UpdateFormValues = z.infer<typeof updateAuditSchema>

export function AuditDialog({ open, onOpenChange, audit }: Props) {
  const { selectedFacility } = useFacility()
  const createAudit = useCreateAudit()
  const updateAudit = useUpdateAudit()
  const { data: reqData } = useRequirementList({ facilityId: selectedFacility?.id || '' })
  const requirements = reqData?.requirements || []

  const isUpdate = !!audit

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createAuditSchema),
    defaultValues: { requirementId: '' },
  })

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateAuditSchema),
    defaultValues: { status: audit?.status || 'IN_PROGRESS' },
  })

  const handleCreate = async (values: CreateFormValues) => {
    try {
      await createAudit.mutateAsync({
        ...values,
        facilityId: selectedFacility?.id || '',
      })
      toast.success('Audit created')
      createForm.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create audit')
    }
  }

  const handleUpdate = async (values: UpdateFormValues) => {
    if (!audit) return
    try {
      await updateAudit.mutateAsync({ id: audit.id, dto: values })
      toast.success('Audit updated')
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update audit')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Update Audit' : 'Schedule Audit'}</DialogTitle>
          <DialogDescription>
            {isUpdate ? 'Update audit result or status' : 'Schedule a new compliance audit'}
          </DialogDescription>
        </DialogHeader>
        {isUpdate ? (
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(handleUpdate)} className='space-y-4'>
              <FormField
                control={updateForm.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='SCHEDULED'>Scheduled</SelectItem>
                        <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                        <SelectItem value='PASSED'>Passed</SelectItem>
                        <SelectItem value='FAILED'>Failed</SelectItem>
                        <SelectItem value='CONDITIONAL'>Conditional Pass</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name='result'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select result' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PASS'>Pass</SelectItem>
                        <SelectItem value='FAIL'>Fail</SelectItem>
                        <SelectItem value='CONDITIONAL'>Conditional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex justify-end gap-3 pt-2'>
                <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type='submit' disabled={updateAudit.isPending}>
                  {updateAudit.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Update
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className='space-y-4'>
              <FormField
                control={createForm.control}
                name='requirementId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select requirement' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requirements.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.requirementCode} — {r.description?.substring(0, 40)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='auditedByUserId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='User ID' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='scheduledDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex justify-end gap-3 pt-2'>
                <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type='submit' disabled={createAudit.isPending}>
                  {createAudit.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Schedule
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
