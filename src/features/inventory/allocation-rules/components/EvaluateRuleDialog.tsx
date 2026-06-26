import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ProductSearchSelect } from '@/components/ProductSearchSelect'
import { useFacility } from '@/hooks/useFacility'
import {
  evaluateSchema,
  type EvaluateFormValues,
} from '../data/allocation-rule-schemas'
import { useEvaluateRules } from '../data/allocation-rule-queries'

interface EvaluateRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EvaluateRuleDialog({ open, onOpenChange }: EvaluateRuleDialogProps) {
  const evaluateRules = useEvaluateRules()
  const { selectedFacility } = useFacility()
  const [result, setResult] = useState<any>(null)

  const form = useForm<EvaluateFormValues>({
    resolver: zodResolver(evaluateSchema) as any,
    defaultValues: {
      productId: '',
      facilityId: selectedFacility?.id || '',
      clientId: '',
      zoneId: '',
      locationId: '',
    },
  })

  useEffect(() => {
    if (selectedFacility?.id) {
      form.setValue('facilityId', selectedFacility.id)
    }
  }, [selectedFacility, form])

  const handleSubmit = async (values: EvaluateFormValues) => {
    try {
      const res = await evaluateRules.mutateAsync({
        facilityId: values.facilityId,
        productId: values.productId,
        clientId: values.clientId || undefined,
        zoneId: values.zoneId || undefined,
        locationId: values.locationId || undefined,
      })
      setResult(res)
      toast.success('Rules evaluated')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Evaluation failed')
    }
  }

  const handleClose = () => {
    form.reset()
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleClose()
    }}>
      <DialogContent className='sm:max-w-[560px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Evaluate Allocation Rules</DialogTitle>
              <DialogDescription>
                Test which allocation rules apply for a given product and context
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='facilityId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility ID *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Facility ID' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='productId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <ProductSearchSelect
                        value={field.value}
                        onValueChange={(productCode) => field.onChange(productCode)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='clientId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Client ID' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='zoneId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Zone ID' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='locationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Location ID' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {result && (
                <div className='rounded-lg border p-3'>
                  <h4 className='mb-2 text-sm font-semibold'>Evaluation Result</h4>
                  <pre className='max-h-[200px] overflow-auto whitespace-pre-wrap text-xs text-muted-foreground'>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={handleClose}>
                Close
              </Button>
              <Button type='submit' disabled={evaluateRules.isPending}>
                {evaluateRules.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Evaluating...
                  </>
                ) : (
                  'Evaluate'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
