import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useScheduleCount } from '@/features/cycle-counts/data/cycle-count-queries'
import { useFacility } from '@/hooks/useFacility'
import { useNavigate } from '@tanstack/react-router'
import { CountMethodSelect } from '@/components/common/forms/CountMethodSelect'

const scheduleSchema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  countMethod: z.enum(['BLIND', 'KNOWN'], {
    errorMap: () => ({ message: 'Count method is required' }),
  }),
  scopeType: z.enum(['FACILITY', 'ZONE', 'LOCATION', 'PRODUCT', 'ABC'], {
    errorMap: () => ({ message: 'Scope type is required' }),
  }),
  scopeIdentifier: z.string().optional(),
  frequencyType: z.enum(['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY'], {
    errorMap: () => ({ message: 'Frequency type is required' }),
  }),
  autoAdjust: z.boolean().optional(),
})

type ScheduleForm = z.infer<typeof scheduleSchema>

const SCOPE_TYPE_OPTIONS = [
  { value: 'FACILITY', label: 'Entire Facility' },
  { value: 'ZONE', label: 'Zone' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'ABC', label: 'ABC Class' },
]

const FREQUENCY_OPTIONS = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

interface ScheduleCountFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ScheduleCountForm({ onSuccess, onCancel }: ScheduleCountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scheduleMutation = useScheduleCount()
  const { selectedFacility } = useFacility()
  const navigate = useNavigate()

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      facilityId: selectedFacility?.id || '',
      countMethod: 'BLIND',
      scopeType: 'FACILITY',
      scopeIdentifier: '',
      frequencyType: 'ONE_TIME',
      autoAdjust: false,
    },
  })

  const onSubmit = async (formData: ScheduleForm) => {
    if (!selectedFacility && !formData.facilityId) {
      toast.error('Please select a facility from the top bar or enter a facility ID')
      return
    }
    setIsSubmitting(true)
    try {
      await scheduleMutation.mutateAsync({
        facilityId: formData.facilityId || selectedFacility!.id,
        countMethod: formData.countMethod,
        scopeType: formData.scopeType,
        scopeIdentifier: formData.scopeIdentifier || undefined,
        frequencyType: formData.frequencyType,
        autoAdjust: formData.autoAdjust,
      })
      toast.success('Cycle count scheduled successfully')
      form.reset()
      if (onSuccess) onSuccess()
      else navigate({ to: '/counts/cycle' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to schedule count')
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchScopeType = form.watch('scopeType')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!onCancel && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Schedule Cycle Count</h1>
              <p className="text-muted-foreground">
                Define the scope and method for a new inventory counting operation
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/counts/cycle' })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Counts
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Scheduling...' : 'Schedule Count'}
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Count Configuration</CardTitle>
            <CardDescription>
              Configure the counting operation parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFacility && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={selectedFacility ? selectedFacility.id : 'facility-uuid'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CountMethodSelect
                control={form.control}
                name="countMethod"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scopeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCOPE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scopeIdentifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope Identifier</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={watchScopeType === 'FACILITY' ? 'All areas' : 'Zone code, location ID, or SKU'}
                      />
                    </FormControl>
                    {watchScopeType !== 'FACILITY' && (
                      <p className="text-xs text-muted-foreground">
                        Required for {watchScopeType.toLowerCase()} scopes
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="frequencyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoAdjust"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-4 pb-1">
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          id="autoAdjust"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormLabel htmlFor="autoAdjust" className="cursor-pointer">Auto-adjust inventory</FormLabel>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically apply count variances to inventory
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {onCancel && (
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Count'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
