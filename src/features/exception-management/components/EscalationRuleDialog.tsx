import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateEscalationRule } from '@/features/exception-management/data/exception-queries'
import { useFacility } from '@/hooks/useFacility'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const escalationRuleSchema = z.object({
  ruleName: z.string().min(1, 'Required'),
  exceptionType: z.string().min(1, 'Required'),
  severityMinimum: z.string().min(1, 'Required'),
  unresolvedHours: z.coerce.number().int().min(1, 'Must be at least 1'),
  escalateToUserId: z.string().min(1, 'Required'),
  isActive: z.boolean().optional(),
  notifyViaEmail: z.boolean().optional(),
})

type EscalationRuleFormValues = z.infer<typeof escalationRuleSchema>

export function EscalationRuleDialog({ open, onOpenChange }: Props) {
  const { currentFacility } = useFacility()
  const create = useCreateEscalationRule()

  const form = useForm<EscalationRuleFormValues>({
    resolver: zodResolver(escalationRuleSchema),
    defaultValues: {
      ruleName: '',
      exceptionType: '',
      severityMinimum: 'Medium',
      unresolvedHours: 24,
      escalateToUserId: '',
      isActive: true,
      notifyViaEmail: false,
    },
  })

  const onSubmit = async (values: EscalationRuleFormValues) => {
    try {
      await create.mutateAsync({
        ...values,
        facilityId: currentFacility?.id || '',
        isActive: values.isActive || undefined,
        notifyViaEmail: values.notifyViaEmail || undefined,
      })
      toast.success('Escalation rule created')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create escalation rule')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Create Escalation Rule</DialogTitle>
          <DialogDescription>Define when an exception should be escalated to a user</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='ruleName' render={({ field }) => (
                <FormItem><FormLabel>Rule Name *</FormLabel><FormControl><Input {...field} placeholder='e.g. Critical Inventory Escalation' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='exceptionType' render={({ field }) => (
                <FormItem><FormLabel>Exception Type *</FormLabel><FormControl><Input {...field} placeholder='e.g. Inventory Discrepancy' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='severityMinimum' render={({ field }) => (
                <FormItem><FormLabel>Minimum Severity *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='Low'>Low</SelectItem><SelectItem value='Medium'>Medium</SelectItem><SelectItem value='High'>High</SelectItem><SelectItem value='Critical'>Critical</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='unresolvedHours' render={({ field }) => (
                <FormItem><FormLabel>Unresolved Hours *</FormLabel><FormControl><Input type='number' {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='escalateToUserId' render={({ field }) => (
              <FormItem><FormLabel>Escalate To User ID *</FormLabel><FormControl><Input {...field} placeholder='User ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='isActive' render={({ field }) => (
                <FormItem className='flex items-center gap-2'><FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className='!mt-0'>Active</FormLabel></FormItem>
              )} />
              <FormField control={form.control} name='notifyViaEmail' render={({ field }) => (
                <FormItem className='flex items-center gap-2'><FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className='!mt-0'>Email Notification</FormLabel></FormItem>
              )} />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={create.isPending}>
                {create.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create Rule
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
