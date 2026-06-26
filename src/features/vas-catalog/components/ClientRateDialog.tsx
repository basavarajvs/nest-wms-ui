import { useEffect } from 'react'
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
import { clientRateSchema, type ClientRateFormValues } from '@/features/vas-catalog/data/vas-catalog-schemas'
import { useSetVasClientRate, useVasServiceList } from '@/features/vas-catalog/data/vas-catalog-queries'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'MXN']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
}

export function ClientRateDialog({ open, onOpenChange, defaultClientId }: Props) {
  const setRate = useSetVasClientRate()
  const { data: servicesData } = useVasServiceList({ isActive: 'true' })
  const services = servicesData?.services || []

  const form = useForm<ClientRateFormValues>({
    resolver: zodResolver(clientRateSchema),
    defaultValues: {
      serviceId: '',
      clientId: defaultClientId || '',
      ratePerUnit: undefined as any,
      currency: 'USD',
      effectiveDate: '',
      expiryDate: '',
      minCharge: undefined,
    },
  })

  useEffect(() => {
    form.reset({
      serviceId: '',
      clientId: defaultClientId || '',
      ratePerUnit: undefined as any,
      currency: 'USD',
      effectiveDate: '',
      expiryDate: '',
      minCharge: undefined,
    })
  }, [form, open, defaultClientId])

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
          <DialogDescription>Configure a VAS rate for a client</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='serviceId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select service' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.serviceCode} – {s.serviceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='clientId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Client ID' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='ratePerUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Per Unit *</FormLabel>
                    <FormControl>
                      <Input type='number' step='any' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='currency'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='effectiveDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='expiryDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='minCharge'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Charge</FormLabel>
                  <FormControl>
                    <Input type='number' step='any' {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
