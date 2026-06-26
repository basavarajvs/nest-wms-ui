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
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createRateSchema, type CreateRateFormValues } from '@/features/billing/data/billing-schemas'
import { useCreateRate } from '@/features/billing/data/billing-queries'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RateDialog({ open, onOpenChange }: Props) {
  const createRate = useCreateRate()

  const form = useForm<CreateRateFormValues>({
    resolver: zodResolver(createRateSchema),
    defaultValues: {
      rateCode: '', rateName: '', rateType: 'FLAT', calculationBasis: 'MONTHLY',
      defaultRate: undefined as any, currency: 'USD', minCharge: undefined, maxCharge: undefined,
      facilityId: '', effectiveDate: '', expiryDate: '', isActive: true,
    },
  })

  const onSubmit = async (values: CreateRateFormValues) => {
    try {
      await createRate.mutateAsync(values)
      toast.success('Rate created')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create rate')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Create Rate</DialogTitle>
          <DialogDescription>Add a new storage rate to the rate master</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='rateCode' render={({ field }) => (
                <FormItem><FormLabel>Rate Code *</FormLabel><FormControl><Input {...field} placeholder='e.g. PALLET-STD' /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='rateName' render={({ field }) => (
                <FormItem><FormLabel>Rate Name *</FormLabel><FormControl><Input {...field} placeholder='e.g. Standard Pallet' /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='rateType' render={({ field }) => (
                <FormItem><FormLabel>Rate Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='PER_PALLET'>Per Pallet</SelectItem><SelectItem value='PER_SQFT'>Per Sq Ft</SelectItem><SelectItem value='PER_CUBIC_FOOT'>Per Cubic Ft</SelectItem><SelectItem value='FLAT'>Flat</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='calculationBasis' render={({ field }) => (
                <FormItem><FormLabel>Calculation Basis</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value='DAILY'>Daily</SelectItem><SelectItem value='WEEKLY'>Weekly</SelectItem><SelectItem value='MONTHLY'>Monthly</SelectItem><SelectItem value='ANNUAL'>Annual</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='defaultRate' render={({ field }) => (
                <FormItem><FormLabel>Default Rate *</FormLabel><FormControl><Input type='number' step='any' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='currency' render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='minCharge' render={({ field }) => (
                <FormItem><FormLabel>Min Charge</FormLabel><FormControl><Input type='number' step='any' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='maxCharge' render={({ field }) => (
                <FormItem><FormLabel>Max Charge</FormLabel><FormControl><Input type='number' step='any' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='facilityId' render={({ field }) => (
              <FormItem><FormLabel>Facility ID *</FormLabel><FormControl><Input {...field} placeholder='Facility ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='effectiveDate' render={({ field }) => (
                <FormItem><FormLabel>Effective Date</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='expiryDate' render={({ field }) => (
                <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='isActive' render={({ field }) => (
              <FormItem className='flex items-center gap-2'><FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className='!mt-0'>Active</FormLabel><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={createRate.isPending}>
                {createRate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
