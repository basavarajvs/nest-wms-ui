import { useCallback, useState, useMemo, useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, PlusIcon } from 'lucide-react'
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
import { createAsnSchema, type CreateAsnFormValues } from '@/features/asns/schemas/asn-schema'
import { useCreateAsn, useClientsForLookup, useVendorsForLookup, useProductsForLookup, useUomsForLookup } from '@/features/asns/data/asn-queries'
import { useClientStore } from '@/stores/client-store'
import { AsnLineItem } from '@/features/asns/components/asn-line-item'
import type { CreateAsnDto } from '@/lib/wms-api/types/wms-api'

interface CreateAsnWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const defaultValues: CreateAsnFormValues = {
  asn_number: '',
  inbound_for_client_id: 0,
  vendor_id: undefined,
  po_number: '',
  carrier_name: '',
  expected_arrival_date: '',
  shipment_date: '',
  tracking_number: '',
  volume: undefined,
  weight: undefined,
  notes: '',
  lines: [],
}

export function CreateAsnWizard({ open, onOpenChange, onSuccess }: CreateAsnWizardProps) {
  const [step, setStep] = useState(1)
  const createMutation = useCreateAsn()
  const { data: clients = [] } = useClientsForLookup()
  const { data: vendors = [] } = useVendorsForLookup()
  const { data: products = [] } = useProductsForLookup()
  const { data: uoms = [] } = useUomsForLookup()
  const { selectedClient } = useClientStore()

  const form = useForm<CreateAsnFormValues>({
    resolver: zodResolver(createAsnSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })

  useEffect(() => {
    if (open) {
      form.reset({
        ...defaultValues,
        inbound_for_client_id: selectedClient ? Number(selectedClient.id) : 0,
      })
      setStep(1)
    }
  }, [open, form, selectedClient])

  const handleNext = useCallback(async () => {
    if (step === 1) {
      const valid = await form.trigger(['asn_number', 'inbound_for_client_id', 'vendor_id', 'po_number', 'carrier_name', 'expected_arrival_date', 'shipment_date', 'tracking_number', 'volume', 'weight', 'notes'])
      if (!valid) return
    }
    if (step === 2) {
      const valid = await form.trigger('lines')
      if (!valid) return
    }
    setStep((s) => s + 1)
  }, [step, form])

  const handleBack = useCallback(() => setStep((s) => s - 1), [])

  const handleSubmit = useCallback(
    (values: CreateAsnFormValues) => {
      const facilityId = Number(localStorage.getItem('facility_id')) || 0
      const payload: CreateAsnDto = {
        asn_number: values.asn_number,
        facility_id: facilityId,
        inbound_for_client_id: values.inbound_for_client_id,
        vendor_id: values.vendor_id || undefined,
        po_number: values.po_number || undefined,
        carrier_name: values.carrier_name || undefined,
        expected_arrival_date: values.expected_arrival_date || undefined,
        shipment_date: values.shipment_date || undefined,
        tracking_number: values.tracking_number || undefined,
        volume: values.volume || undefined,
        weight: values.weight || undefined,
        notes: values.notes || undefined,
        lines: values.lines.map((l) => ({
          product_id: l.product_id,
          expected_quantity: l.expected_quantity,
          uom_id: l.uom_id,
          lot_number: l.lot_number || undefined,
          expiry_date: l.expiry_date || undefined,
          notes: l.notes || undefined,
        })),
      }
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
      })
    },
    [createMutation, onOpenChange, onSuccess],
  )

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.client_id, label: c.client_name || String(c.client_id) })), [clients])
  const vendorOptions = useMemo(() => vendors.map((v) => ({ value: v.vendor_id, label: v.vendor_name || String(v.vendor_id) })), [vendors])
  const productOptions = useMemo(() => products.map((p) => ({ value: p.product_id, label: p.product_name || String(p.product_id) })), [products])
  const uomOptions = useMemo(() => uoms.map((u) => ({ value: u.uom_id, label: u.uom_name || String(u.uom_id) })), [uoms])

  const summaryHeader = form.watch()
  const summaryLines = form.watch('lines')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {step === 1 && 'ASN Header'}
            {step === 2 && 'ASN Lines'}
            {step === 3 && 'Review & Submit'}
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3
            {step === 1 && ' — Enter basic ASN information'}
            {step === 2 && ' — Add expected products and quantities'}
            {step === 3 && ' — Confirm before submitting'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 px-0.5">
              {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="asn_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ASN Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ASN-2026-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inbound_for_client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                        value={field.value ? String(field.value) : ''}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full overflow-hidden">
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientOptions.map((opt) => (
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
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                        value={field.value ? String(field.value) : ''}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full overflow-hidden">
                            <SelectValue placeholder="Select vendor (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendorOptions.map((opt) => (
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
                  control={form.control}
                  name="carrier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. FedEx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="po_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Purchase order number" {...field} />
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
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="shipment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tracking_number"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Tracking Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Carrier tracking number" {...field} />
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
                        <Textarea placeholder="Additional notes" className="resize-none" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add one or more product lines</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product_id: 0, expected_quantity: 0, uom_id: 0, lot_number: '', expiry_date: '', notes: '' })}
                  >
                    <PlusIcon className="mr-1 size-3.5" /> Add Line
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  {fields.map((field, index) => (
                    <AsnLineItem
                      key={field.id}
                      index={index}
                      onRemove={() => remove(index)}
                      productOptions={productOptions}
                      uomOptions={uomOptions}
                      canRemove={fields.length > 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Header</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">ASN Number:</span>
                      <span className="ml-2 font-medium">{summaryHeader.asn_number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client:</span>
                      <span className="ml-2 font-medium">
                        {clientOptions.find((c) => c.value === summaryHeader.inbound_for_client_id)?.label || summaryHeader.inbound_for_client_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Facility:</span>
                      <span className="ml-2 font-medium">
                        {facilityOptions.find((f) => f.value === summaryHeader.facility_id)?.label || summaryHeader.facility_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vendor:</span>
                      <span className="ml-2 font-medium">
                        {vendorOptions.find((v) => v.value === summaryHeader.vendor_id)?.label || summaryHeader.vendor_id || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carrier:</span>
                      <span className="ml-2 font-medium">{summaryHeader.carrier_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PO Number:</span>
                      <span className="ml-2 font-medium">{summaryHeader.po_number || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Arrival:</span>
                      <span className="ml-2 font-medium">{summaryHeader.expected_arrival_date || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Shipment Date:</span>
                      <span className="ml-2 font-medium">{summaryHeader.shipment_date || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tracking Number:</span>
                      <span className="ml-2 font-medium">{summaryHeader.tracking_number || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="ml-2 font-medium">{summaryHeader.volume ?? '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="ml-2 font-medium">{summaryHeader.weight ?? '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Notes:</span>
                      <span className="ml-2 font-medium">{summaryHeader.notes || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Lines ({summaryLines.length})</p>
                  <div className="space-y-2 text-sm">
                    {summaryLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2 text-sm border-b pb-2 last:border-0">
                        <span className="text-muted-foreground col-span-2">
                          {productOptions.find((p) => p.value === line.product_id)?.label || line.product_id}
                        </span>
                        <span className="font-medium">Qty: {line.expected_quantity}</span>
                        <span className="text-muted-foreground">
                          {uomOptions.find((u) => u.value === line.uom_id)?.label || line.uom_id}
                        </span>
                        <span className="text-xs text-muted-foreground text-right">
                          {line.lot_number || line.expiry_date ? `Lot: ${line.lot_number || '-'} / Exp: ${line.expiry_date || '-'}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            </div>

            <DialogFooter className="gap-2 shrink-0">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={createMutation.isPending}>
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  Submit ASN
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
