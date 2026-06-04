import { useEffect, useMemo } from 'react'
import * as z from 'zod'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateRule, useUpdateRule, type WmsRule } from '../data/rule-queries'

const RULE_TYPES = [
  { value: 'PUTAWAY', label: 'Putaway' },
  { value: 'ALLOCATION', label: 'Allocation' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'REPLENISHMENT', label: 'Replenishment' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'CUSTOM', label: 'Custom' },
] as const

const ruleSchema = z.object({
  ruleKey: z.string().min(1, 'Rule key is required').max(100),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  ruleType: z.string().min(1, 'Rule type is required'),
  definitionJson: z.string().min(1, 'Rule definition (JSON) is required'),
  active: z.boolean().default(true),
})

type RuleForm = z.infer<typeof ruleSchema>

interface RuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem?: WmsRule | null
  onSuccess?: () => void
}

export function RuleDialog({ open, onOpenChange, editItem, onSuccess }: RuleDialogProps) {
  const createMutation = useCreateRule()
  const updateMutation = useUpdateRule()

  const defaultDefinition = useMemo(() => {
    if (editItem?.definitionJson) {
      try {
        return JSON.stringify(editItem.definitionJson, null, 2)
      } catch {
        return ''
      }
    }
    return ''
  }, [editItem])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      ruleKey: '',
      name: '',
      description: '',
      ruleType: '',
      definitionJson: '',
      active: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (editItem) {
        setValue('ruleKey', editItem.ruleKey)
        setValue('name', editItem.name || '')
        setValue('description', editItem.description || '')
        setValue('ruleType', editItem.ruleType)
        setValue('definitionJson', defaultDefinition)
        setValue('active', editItem.status !== 'INACTIVE')
      } else {
        reset()
      }
    }
  }, [open, editItem, setValue, reset, defaultDefinition])

  const onSubmit = async (values: RuleForm) => {
    try {
      let definitionJson: Record<string, unknown>
      try {
        definitionJson = JSON.parse(values.definitionJson)
      } catch {
        toast.error('Invalid JSON in rule definition')
        return
      }

      const dto = {
        ruleKey: values.ruleKey,
        ruleType: values.ruleType,
        definitionJson,
      }

      if (editItem) {
        await updateMutation.mutateAsync({ key: editItem.ruleKey, dto })
        toast.success('Rule updated successfully')
      } else {
        await createMutation.mutateAsync(dto)
        toast.success('Rule created successfully')
      }

      onOpenChange(false)
      reset()
      onSuccess?.()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || `Failed to ${editItem ? 'update' : 'create'} rule`
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
            <DialogDescription>
              {editItem
                ? 'Modify the rule configuration below.'
                : 'Define a new business rule with its JSON configuration.'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='ruleKey'>Rule Key *</Label>
                <Input
                  id='ruleKey'
                  {...register('ruleKey')}
                  placeholder='putaway-default'
                  disabled={!!editItem}
                />
                {errors.ruleKey && (
                  <p className='text-sm text-destructive'>{errors.ruleKey.message}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='ruleType'>Rule Type *</Label>
                <Select
                  onValueChange={(val) => setValue('ruleType', val)}
                  value={watch('ruleType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map((rt) => (
                      <SelectItem key={rt.value} value={rt.value}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ruleType && (
                  <p className='text-sm text-destructive'>{errors.ruleType.message}</p>
                )}
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='name'>Name *</Label>
              <Input
                id='name'
                {...register('name')}
                placeholder='Default Putaway Rule'
              />
              {errors.name && (
                <p className='text-sm text-destructive'>{errors.name.message}</p>
              )}
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='description'>Description</Label>
              <Input
                id='description'
                {...register('description')}
                placeholder='Routes inventory to preferred zones'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='definitionJson'>Rule Definition (JSON) *</Label>
              <Textarea
                id='definitionJson'
                {...register('definitionJson')}
                className='min-h-[160px] font-mono text-sm'
                placeholder={JSON.stringify(
                  {
                    conditions: [{ field: 'product.category', operator: 'eq', value: 'HAZMAT' }],
                    action: 'route_to_zone',
                    targetZone: 'BULK',
                  },
                  null,
                  2
                )}
              />
              {errors.definitionJson && (
                <p className='text-sm text-destructive'>{errors.definitionJson.message}</p>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Switch
                id='active'
                checked={watch('active')}
                onCheckedChange={(val) => setValue('active', val)}
              />
              <Label htmlFor='active'>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editItem
                  ? 'Update Rule'
                  : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
