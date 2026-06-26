import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface PutawayRule {
  id: string
  name: string
  priority: number
  conditionField: string
  conditionOperator: string
  conditionValue: string
  targetZone: string
}

const CONDITION_FIELDS = [
  { label: 'Product Type', value: 'productType' },
  { label: 'Hazardous Class', value: 'hazardousClass' },
  { label: 'Storage Requirement', value: 'storageRequirement' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Country of Origin', value: 'countryOfOrigin' },
  { label: 'Weight Range', value: 'weightRange' },
]

const CONDITION_OPERATORS = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'notEquals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Starts With', value: 'startsWith' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
]

const ZONE_OPTIONS = [
  { label: 'Receiving', value: 'RCV' },
  { label: 'Bulk Storage', value: 'BULK' },
  { label: 'Forward Pick', value: 'FPK' },
  { label: 'Quality', value: 'QC' },
  { label: 'Shipping', value: 'SHP' },
  { label: 'Hazmat', value: 'HAZ' },
  { label: 'Returns', value: 'RET' },
  { label: 'Damaged', value: 'DMG' },
]

let nextId = 1

function createRule(): PutawayRule {
  return {
    id: `rule-${nextId++}`,
    name: '',
    priority: 1,
    conditionField: 'productType',
    conditionOperator: 'equals',
    conditionValue: '',
    targetZone: 'BULK',
  }
}

interface PutawayRuleDesignerProps {
  facilityId?: string
}

export function PutawayRuleDesigner(_props: PutawayRuleDesignerProps) {
  const [rules, setRules] = useState<PutawayRule[]>([createRule()])

  const updateRule = useCallback((index: number, field: keyof PutawayRule, value: string | number) => {
    setRules((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const addRule = useCallback(() => {
    setRules((prev) => [...prev, createRule()])
  }, [])

  const removeRule = useCallback((index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const moveRule = useCallback((from: number, to: number) => {
    if (to < 0 || to >= rules.length) return
    setRules((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((r, i) => ({ ...r, priority: i + 1 }))
    })
  }, [rules.length])

  const handleSave = useCallback(() => {
    const invalid = rules.find((r) => !r.name.trim() || !r.conditionValue.trim())
    if (invalid) {
      toast.error('Each rule must have a name and condition value.')
      return
    }
    toast.success(`${rules.length} putaway rules saved.`)
  }, [rules])

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>Putaway Rule Designer</span>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={addRule}>
              <Plus className='mr-1 h-4 w-4' /> Add Rule
            </Button>
            <Button size='sm' onClick={handleSave}>
              <Save className='mr-1 h-4 w-4' /> Save Rules
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Define routing rules to determine where products are put away based on product attributes.
          Rules are evaluated in priority order.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {rules.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            No rules defined. Click "Add Rule" to create one.
          </p>
        ) : (
          rules.map((rule, i) => (
            <div
              key={rule.id}
              className='rounded-lg border bg-card p-4 space-y-3'
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 cursor-grab'
                    onClick={() => moveRule(i, i - 1)}
                    disabled={i === 0}
                  >
                    <GripVertical className='h-3 w-3' />
                  </Button>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Priority {i + 1}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeRule(i)}
                  disabled={rules.length <= 1}
                >
                  <Trash2 className='h-4 w-4 text-destructive' />
                </Button>
              </div>

              <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
                <div className='grid gap-1.5'>
                  <Label className='text-xs'>Rule Name</Label>
                  <Input
                    value={rule.name}
                    onChange={(e) => updateRule(i, 'name', e.target.value)}
                    placeholder='e.g. Hazardous to Hazmat'
                  />
                </div>
                <div className='grid gap-1.5'>
                  <Label className='text-xs'>Condition Field</Label>
                  <Select
                    value={rule.conditionField}
                    onValueChange={(v) => updateRule(i, 'conditionField', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-1.5'>
                  <Label className='text-xs'>Operator</Label>
                  <Select
                    value={rule.conditionOperator}
                    onValueChange={(v) => updateRule(i, 'conditionOperator', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-1.5'>
                  <Label className='text-xs'>Condition Value</Label>
                  <Input
                    value={rule.conditionValue}
                    onChange={(e) => updateRule(i, 'conditionValue', e.target.value)}
                    placeholder='e.g. HAZARDOUS'
                  />
                </div>
              </div>

              <div className='grid gap-1.5 md:w-1/4'>
                <Label className='text-xs'>Target Zone</Label>
                <Select
                  value={rule.targetZone}
                  onValueChange={(v) => updateRule(i, 'targetZone', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_OPTIONS.map((z) => (
                      <SelectItem key={z.value} value={z.value}>
                        {z.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))
        )}

        <Separator />

        <div className='rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground'>
          <p className='font-medium text-foreground'>How Putaway Rules Work</p>
          <ul className='mt-1 list-disc pl-4 space-y-0.5'>
            <li>When a product arrives at receiving, the system evaluates each rule in priority order.</li>
            <li>If the product&apos;s attribute matches the rule condition, it is routed to the target zone.</li>
            <li>If no rules match, the product is routed to the default zone (Bulk Storage).</li>
            <li>Rules are evaluated sequentially from Priority 1 to N.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
