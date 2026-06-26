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
import { calculateChargesSchema, type CalculateChargesFormValues } from '@/features/billing/data/billing-schemas'
import { useCalculateCharges } from '@/features/billing/data/billing-queries'
import { useFacility } from '@/hooks/useFacility'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChargeCalculateDialog({ open, onOpenChange }: Props) {
  const { selectedFacility } = useFacility()
  const calculate = useCalculateCharges()

  const form = useForm<CalculateChargesFormValues>({
    resolver: zodResolver(calculateChargesSchema),
    defaultValues: { facilityId: selectedFacility?.id || '', cycleId: '', clientId: '', periodStart: '', periodEnd: '' },
  })

  const onSubmit = async (values: CalculateChargesFormValues) => {
    try {
      await calculate.mutateAsync(values)
      toast.success('Charges calculated')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to calculate charges')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Calculate Charges</DialogTitle>
          <DialogDescription>Calculate storage charges from snapshots</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='facilityId' render={({ field }) => (
              <FormItem><FormLabel>Facility ID *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='clientId' render={({ field }) => (
                <FormItem><FormLabel>Client ID</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='cycleId' render={({ field }) => (
                <FormItem><FormLabel>Cycle ID</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='periodStart' render={({ field }) => (
                <FormItem><FormLabel>Period Start *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='periodEnd' render={({ field }) => (
                <FormItem><FormLabel>Period End *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={calculate.isPending}>
                {calculate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Calculate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
