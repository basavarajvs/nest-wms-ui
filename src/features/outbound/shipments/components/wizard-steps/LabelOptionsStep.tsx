import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface WizardLabelOptions {
  labelFormat: string
  copies: number
  includePackingSlip: boolean
}

interface LabelOptionsStepProps {
  data: WizardLabelOptions
  onChange: (field: keyof WizardLabelOptions, value: string | boolean) => void
}

const LABEL_FORMATS = [
  { value: 'ZPL', label: 'ZPL (Zebra)' },
  { value: 'PDF', label: 'PDF' },
  { value: 'EPL', label: 'EPL' },
  { value: 'PNG', label: 'PNG Image' },
]

export function LabelOptionsStep({ data, onChange }: LabelOptionsStepProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="labelFormat">Label Format</Label>
        <Select value={data.labelFormat} onValueChange={(val) => onChange('labelFormat', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select label format..." />
          </SelectTrigger>
          <SelectContent>
            {LABEL_FORMATS.map((fmt) => (
              <SelectItem key={fmt.value} value={fmt.value}>
                {fmt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="copies">Number of Copies</Label>
        <Input
          id="copies"
          type="number"
          min={1}
          max={10}
          value={data.copies}
          onChange={(e) => onChange('copies', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="includePackingSlip"
          checked={data.includePackingSlip}
          onCheckedChange={(val) => onChange('includePackingSlip', val)}
        />
        <Label htmlFor="includePackingSlip" className="cursor-pointer">
          Include Packing Slip
        </Label>
      </div>
    </div>
  )
}
