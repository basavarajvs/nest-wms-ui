import { useCallback, useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2Icon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, PlusIcon, XIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOrdersList } from '@/features/outbound/data/order-queries'
import { useCreateWave, WAVE_TYPE_OPTIONS, WAVE_TYPE_LABELS } from '@/features/outbound/data/wave-queries'
import { useFacilityStore } from '@/stores/facility-store'

const waveFormSchema = z.object({
  wave_name: z.string().min(1, 'Wave name is required'),
  wave_type: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  order_ids: z.array(z.string()).min(1, 'At least one order must be selected'),
})

type WaveFormValues = z.infer<typeof waveFormSchema>

interface CreateWaveWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateWaveWizard({ open, onOpenChange, onSuccess }: CreateWaveWizardProps) {
  const [step, setStep] = useState(1)
  const createMutation = useCreateWave()
  const facilityId = useFacilityStore((s) => s.facilityId)

  const { data: ordersData } = useOrdersList({ page: 1, limit: 200, search: '' })

  const form = useForm<WaveFormValues>({
    resolver: zodResolver(waveFormSchema),
    defaultValues: { wave_name: '', wave_type: '', description: '', notes: '', order_ids: [] },
  })

  const selectedIds = form.watch('order_ids')

  const allOrders = ordersData?.data ?? []
  const selectedOrders = useMemo(() => allOrders.filter((o) => selectedIds.includes(o.order_id)), [allOrders, selectedIds])

  useEffect(() => {
    if (open) {
      form.reset({ wave_name: '', wave_type: '', description: '', notes: '', order_ids: [] })
      setStep(1)
    }
  }, [open, form])

  const toggleOrder = useCallback(
    (orderId: string) => {
      const current = form.getValues('order_ids')
      if (current.includes(orderId)) {
        form.setValue('order_ids', current.filter((id) => id !== orderId), { shouldValidate: true })
      } else {
        form.setValue('order_ids', [...current, orderId], { shouldValidate: true })
      }
    },
    [form],
  )

  const handleNext = useCallback(async () => {
    if (step === 1) {
      const valid = await form.trigger(['wave_name', 'description', 'notes'])
      if (!valid) return
    }
    if (step === 2) {
      const valid = await form.trigger('order_ids')
      if (!valid) return
    }
    setStep((s) => s + 1)
  }, [step, form])

  const handleBack = useCallback(() => setStep((s) => s - 1), [])

  const handleSubmit = useCallback(
    (values: WaveFormValues) => {
      if (!facilityId) return
      createMutation.mutate(
        {
          facility_id: String(facilityId),
          wave_name: values.wave_name,
          wave_type: values.wave_type || undefined,
          description: values.description || undefined,
          notes: values.notes || undefined,
          order_ids: values.order_ids,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            onSuccess?.()
          },
        },
      )
    },
    [facilityId, createMutation, onOpenChange, onSuccess],
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="wave_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wave Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Wave-2024-001" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="wave_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wave Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {WAVE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{WAVE_TYPE_LABELS[opt]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Optional description..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea placeholder="Optional notes..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select orders to include in this wave ({selectedIds.length} selected)
      </p>
      {allOrders.length > 0 ? (
        <div className="max-h-64 overflow-y-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allOrders.map((order) => {
                const isSelected = selectedIds.includes(order.order_id)
                return (
                  <TableRow
                    key={order.order_id}
                    className={`cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                    onClick={() => toggleOrder(order.order_id)}
                  >
                    <TableCell>
                      <div
                        className={`size-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary text-primary-foreground' : ''
                        }`}
                      >
                        {isSelected && <CheckIcon className="size-3" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name ?? '-'}</TableCell>
                    <TableCell>{order.status ?? '-'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No orders found. Create orders first.</p>
      )}
      <FormMessage>{form.formState.errors.order_ids?.message}</FormMessage>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name: </span>
            {form.getValues('wave_name')}
          </div>
          {form.getValues('description') && (
            <div>
              <span className="text-muted-foreground">Description: </span>
              {form.getValues('description')}
            </div>
          )}
          {form.getValues('notes') && (
            <div>
              <span className="text-muted-foreground">Notes: </span>
              {form.getValues('notes')}
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Orders: </span>
            {selectedOrders.length} selected
          </div>
        </CardContent>
      </Card>

      {selectedOrders.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedOrders.map((order) => (
              <TableRow key={order.order_id}>
                <TableCell className="font-medium">{order.order_number}</TableCell>
                <TableCell>{order.customer_name ?? '-'}</TableCell>
                <TableCell>{order.status ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Picking Wave</DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Select Orders' : 'Review'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <DialogFooter>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={createMutation.isPending}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <><Loader2Icon className="h-4 w-4 animate-spin mr-1" /> Creating...</>
                  ) : (
                    <><CheckIcon className="h-4 w-4 mr-1" /> Create Wave</>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
