import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { createCycleSchema, type CreateCycleFormValues } from '@/features/billing/data/billing-schemas'
import { useCreateBillingCycle } from '@/features/billing/data/billing-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CycleDialog({ open, onOpenChange }: Props) {
  const createCycle = useCreateBillingCycle()

  const form = useForm<CreateCycleFormValues>({
    resolver: zodResolver(createCycleSchema),
    defaultValues: { cycleCode: '', cycleName: '', facilityId: '', frequency: 'MONTHLY', billingDay: undefined as any },
  })

  const onSubmit = async (values: CreateCycleFormValues) => {
    try {
      await createCycle.mutateAsync(values)
      toast.success('Billing cycle created')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create billing cycle')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Create Billing Cycle</DialogTitle>
          <DialogDescription>Define a new billing cycle for storage charges</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='cycleCode' render={({ field }) => (
                <FormItem><FormLabel>Cycle Code *</FormLabel><FormControl><Input {...field} placeholder='e.g. MONTHLY-JAN' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='cycleName' render={({ field }) => (
                <FormItem><FormLabel>Cycle Name *</FormLabel><FormControl><Input {...field} placeholder='e.g. Monthly January' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='facilityId' render={({ field }) => (
              <FormItem><FormLabel>Facility ID *</FormLabel><FormControl><Input {...field} placeholder='Facility ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='frequency' render={({ field }) => (
                <FormItem><FormLabel>Frequency</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='WEEKLY'>Weekly</SelectItem><SelectItem value='MONTHLY'>Monthly</SelectItem><SelectItem value='QUARTERLY'>Quarterly</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='billingDay' render={({ field }) => (
                <FormItem><FormLabel>Billing Day</FormLabel><FormControl><Input type='number' min={1} max={31} {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={createCycle.isPending}>
                {createCycle.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
