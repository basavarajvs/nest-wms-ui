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
import { clientRateSchema, type ClientRateFormValues } from '@/features/billing/data/billing-schemas'
import { useSetClientRate, useRateList } from '@/features/billing/data/billing-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientRateDialog({ open, onOpenChange }: Props) {
  const setRate = useSetClientRate()
  const { data: ratesData } = useRateList({ isActive: 'true' })
  const rates = ratesData?.rates || []

  const form = useForm<ClientRateFormValues>({
    resolver: zodResolver(clientRateSchema),
    defaultValues: { rateMasterId: '', clientId: '', negotiatedRate: undefined as any, effectiveDate: '', expiryDate: '' },
  })

  const onSubmit = async (values: ClientRateFormValues) => {
    try {
      await setRate.mutateAsync(values)
      toast.success('Client rate set')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to set client rate')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Set Client Rate</DialogTitle>
          <DialogDescription>Assign a negotiated rate to a client</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='rateMasterId' render={({ field }) => (
              <FormItem><FormLabel>Rate *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder='Select rate' /></SelectTrigger></FormControl><SelectContent>{rates.map((r) => <SelectItem key={r.id} value={r.id}>{r.rateCode} – {r.rateName}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='clientId' render={({ field }) => (
              <FormItem><FormLabel>Client ID *</FormLabel><FormControl><Input {...field} placeholder='Client ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='negotiatedRate' render={({ field }) => (
              <FormItem><FormLabel>Negotiated Rate *</FormLabel><FormControl><Input type='number' step='any' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='effectiveDate' render={({ field }) => (
                <FormItem><FormLabel>Effective Date</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='expiryDate' render={({ field }) => (
                <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={setRate.isPending}>
                {setRate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Set Rate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
