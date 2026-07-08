import { useFormContext } from 'react-hook-form'
import {
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
import { Button } from '@/components/ui/button'
import { Trash2Icon } from 'lucide-react'
import type { CreateAsnFormValues } from '@/features/asns/schemas/asn-schema'

interface AsnLineItemProps {
  index: number
  onRemove: () => void
  productOptions: { value: number; label: string }[]
  uomOptions: { value: number; label: string }[]
  canRemove: boolean
}

export function AsnLineItem({
  index,
  onRemove,
  productOptions,
  uomOptions,
  canRemove,
}: AsnLineItemProps) {
  const { control } = useFormContext<CreateAsnFormValues>()

  return (
    <div className="grid grid-cols-[1fr_120px_110px_150px_150px_1fr_auto] gap-2 items-start border-b pb-3 pt-3 last:border-0 [&>*]:min-w-0">
      <FormField
        control={control}
        name={`lines.${index}.product_id`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product *</FormLabel>
            <Select
              onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
              value={field.value ? String(field.value) : ''}
            >
              <FormControl>
                <SelectTrigger className="w-full overflow-hidden">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {productOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
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
        control={control}
        name={`lines.${index}.expected_quantity`}
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormLabel>Qty *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="0"
                value={field.value || ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`lines.${index}.uom_id`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>UOM *</FormLabel>
            <Select
              onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
              value={field.value ? String(field.value) : ''}
            >
              <FormControl>
                <SelectTrigger className="w-full overflow-hidden">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {uomOptions.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
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
        control={control}
        name={`lines.${index}.lot_number`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lot #</FormLabel>
            <FormControl>
              <Input placeholder="e.g. LOT-A1" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`lines.${index}.expiry_date`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expiry</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`lines.${index}.notes`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Input placeholder="Line notes" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex items-center justify-center self-stretch">
        {canRemove && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
            <Trash2Icon className="size-3.5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  )
}
