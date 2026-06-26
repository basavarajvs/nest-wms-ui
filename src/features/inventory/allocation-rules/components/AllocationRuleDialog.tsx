import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFacility } from '@/hooks/useFacility'
import {
  allocationRuleSchema,
  RULE_TYPE_OPTIONS,
  type AllocationRuleFormValues,
} from '../data/allocation-rule-schemas'
import {
  useCreateAllocationRule,
  useUpdateAllocationRule,
  type AllocationRule,
} from '../data/allocation-rule-queries'

interface AllocationRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: AllocationRule | null
}

export function AllocationRuleDialog({ open, onOpenChange, rule }: AllocationRuleDialogProps) {
  const createRule = useCreateAllocationRule()
  const updateRule = useUpdateAllocationRule()
  const { selectedFacility } = useFacility()

  const form = useForm<AllocationRuleFormValues>({
    resolver: zodResolver(allocationRuleSchema) as any,
    defaultValues: {
      ruleName: '',
      ruleType: '',
      priority: 0,
      isActive: true,
      effectiveDate: '',
      expiryDate: '',
      description: '',
    },
  })

  useEffect(() => {
    if (rule) {
      form.reset({
        ruleName: rule.ruleName || '',
        ruleType: rule.ruleType || '',
        priority: rule.priority ?? 0,
        isActive: rule.isActive ?? true,
        effectiveDate: rule.effectiveDate || '',
        expiryDate: rule.expiryDate || '',
        description: rule.description || '',
      })
    } else {
      form.reset({
        ruleName: '',
        ruleType: '',
        priority: 0,
        isActive: true,
        effectiveDate: '',
        expiryDate: '',
        description: '',
      })
    }
  }, [rule, form])

  const handleSubmit = async (values: AllocationRuleFormValues) => {
    if (!selectedFacility?.id) {
      toast.error('Please select a facility first')
      return
    }
    try {
      if (rule) {
        await updateRule.mutateAsync({
          id: rule.id,
          dto: {
            ruleName: values.ruleName || undefined,
            ruleType: values.ruleType || undefined,
            priority: values.priority || undefined,
            isActive: values.isActive,
            effectiveDate: values.effectiveDate || undefined,
            expiryDate: values.expiryDate || undefined,
            description: values.description || undefined,
          },
        })
        toast.success('Rule updated successfully')
      } else {
        await createRule.mutateAsync({
          facilityId: selectedFacility.id,
          ruleName: values.ruleName,
          ruleType: values.ruleType,
          priority: values.priority || 0,
          isActive: values.isActive ?? true,
          effectiveDate: values.effectiveDate || undefined,
          expiryDate: values.expiryDate || undefined,
          description: values.description || undefined,
        })
        toast.success('Rule created successfully')
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to save rule')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) onOpenChange(false)
    }}>
      <DialogContent className='sm:max-w-[560px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{rule ? 'Edit Allocation Rule' : 'Create Allocation Rule'}</DialogTitle>
              <DialogDescription>
                Configure an inventory allocation rule with type, priority, and scheduling
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='ruleName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. FIFO for Perishables' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='ruleType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RULE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          placeholder='0'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
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
                        <Input type='date' {...field} />
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
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder='Describe the purpose of this rule...' rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                    <div className='space-y-0.5'>
                      <FormLabel>Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createRule.isPending || updateRule.isPending}>
                {createRule.isPending || updateRule.isPending ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
