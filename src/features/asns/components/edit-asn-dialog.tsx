import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useUpdateAsn,
  useClientsForLookup,
  useVendorsForLookup,
  useAsnLines,
} from '@/features/asns/data/asn-queries'
import type { AdvanceShipNoticeDto } from '@/lib/wms-api/types/wms-api'

const editAsnSchema = z.object({
  carrier_name: z.string().optional().or(z.literal('')),
  expected_arrival_date: z.string().optional().or(z.literal('')),
  tracking_number: z.string().optional().or(z.literal('')),
  volume: z.number().optional(),
  weight: z.number().optional(),
  notes: z.string().optional().or(z.literal('')),
})

type EditAsnFormValues = z.infer<typeof editAsnSchema>

interface EditAsnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asn: AdvanceShipNoticeDto
  onSuccess?: () => void
}

export function EditAsnDialog({ open, onOpenChange, asn, onSuccess }: EditAsnDialogProps) {
  const updateMutation = useUpdateAsn()
  const { data: clients = [] } = useClientsForLookup()
  const { data: vendors = [] } = useVendorsForLookup()
  const { data: lines = [] } = useAsnLines(String(asn.asn_id))

  const form = useForm<EditAsnFormValues>({
    resolver: zodResolver(editAsnSchema),
    defaultValues: {
      carrier_name: asn.carrier_name ?? '',
      expected_arrival_date: asn.expected_arrival_date ?? '',
      tracking_number: asn.tracking_number ?? '',
      volume: asn.volume ?? undefined,
      weight: asn.weight ?? undefined,
      notes: asn.notes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        carrier_name: asn.carrier_name ?? '',
        expected_arrival_date: asn.expected_arrival_date ?? '',
        tracking_number: asn.tracking_number ?? '',
        volume: asn.volume ?? undefined,
        weight: asn.weight ?? undefined,
        notes: asn.notes ?? '',
      })
    }
  }, [open, asn, form])

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.client_id, label: c.client_name || String(c.client_id) })), [clients])
  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v.vendor_id, label: v.vendor_name || String(v.vendor_id) })), [vendors])

  const handleSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(
      {
        id: String(asn.asn_id),
        data: {
          carrier_name: values.carrier_name || undefined,
          expected_arrival_date: values.expected_arrival_date || undefined,
          tracking_number: values.tracking_number || undefined,
          notes: values.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
      },
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit ASN #{asn.asn_number}</DialogTitle>
          <DialogDescription>Update ASN header details. Some fields are locked after creation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 px-0.5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="carrier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. FedEx" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expected_arrival_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Arrival Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tracking_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="0"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes" className="resize-none" rows={2} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">ASN Info (read-only)</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">ASN Number:</span>
                    <span className="font-medium">{asn.asn_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{clientOptions.find((c) => c.value === asn.inbound_for_client_id)?.label || asn.inbound_for_client_id || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Vendor:</span>
                    <span className="font-medium">{vendorOptions.find((v) => v.value === asn.vendor_id)?.label || asn.vendor_name || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">PO Number:</span>
                    <span className="font-medium">{asn.po_number || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Shipment Date:</span>
                    <span className="font-medium">{asn.shipment_date || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{asn.status}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Lines ({lines.length})
                </p>
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No line items</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs uppercase">
                          <th className="text-left py-2 pr-2">Product</th>
                          <th className="text-right py-2 px-2">Qty</th>
                          <th className="text-left py-2 px-2">UOM</th>
                          <th className="text-left py-2 px-2">Lot</th>
                          <th className="text-left py-2 px-2">Expiry</th>
                          <th className="text-left py-2 pl-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) => (
                          <tr key={line.asn_line_id} className="border-b last:border-0">
                            <td className="py-2 pr-2 font-medium">{line.product_name || `ID: ${line.product_id}`}</td>
                            <td className="py-2 px-2 text-right">{line.expected_quantity}</td>
                            <td className="py-2 px-2">{line.uom_name || `ID: ${line.uom_id}`}</td>
                            <td className="py-2 px-2">{line.lot_number || '-'}</td>
                            <td className="py-2 px-2">{line.expiry_date || '-'}</td>
                            <td className="py-2 pl-2">{line.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 shrink-0 mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
