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
import { Textarea } from '@/components/ui/textarea'
import { generateInvoiceSchema, type GenerateInvoiceFormValues } from '@/features/billing/data/billing-schemas'
import { useGenerateInvoice } from '@/features/billing/data/billing-queries'
import { useFacility } from '@/hooks/useFacility'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvoiceGenerateDialog({ open, onOpenChange }: Props) {
  const { selectedFacility } = useFacility()
  const generate = useGenerateInvoice()

  const form = useForm<GenerateInvoiceFormValues>({
    resolver: zodResolver(generateInvoiceSchema),
    defaultValues: {
      facilityId: selectedFacility?.id || '', clientId: '',
      periodStart: '', periodEnd: '', dueDate: '',
      taxAmount: undefined, discountAmount: undefined, notes: '',
    },
  })

  const onSubmit = async (values: GenerateInvoiceFormValues) => {
    try {
      await generate.mutateAsync(values)
      toast.success('Invoice generated')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate invoice')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>Generate an invoice from calculated charges</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='facilityId' render={({ field }) => (
              <FormItem><FormLabel>Facility ID *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='clientId' render={({ field }) => (
              <FormItem><FormLabel>Client ID *</FormLabel><FormControl><Input {...field} placeholder='Client ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='periodStart' render={({ field }) => (
                <FormItem><FormLabel>Period Start *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='periodEnd' render={({ field }) => (
                <FormItem><FormLabel>Period End *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='dueDate' render={({ field }) => (
              <FormItem><FormLabel>Due Date *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='grid grid-cols-2 gap-4'>
              <FormField control={form.control} name='taxAmount' render={({ field }) => (
                <FormItem><FormLabel>Tax Amount</FormLabel><FormControl><Input type='number' step='any' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='discountAmount' render={({ field }) => (
                <FormItem><FormLabel>Discount Amount</FormLabel><FormControl><Input type='number' step='any' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name='notes' render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={generate.isPending}>
                {generate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Generate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
