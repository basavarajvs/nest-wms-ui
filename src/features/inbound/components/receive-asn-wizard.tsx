import { useCallback, useMemo, useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, SearchIcon, CheckCircle2Icon, AlertCircleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAsnByNumber, useAsnWithLines, useLocations, useCreateGoodsReceipt, useReceiveLine, useCompleteReceipt } from '@/features/inbound/data/receive-queries'
import { receiveFormSchema, type ReceiveFormValues } from '@/features/inbound/schemas/receive-schema'
import { useClientStore } from '@/stores/client-store'
import type { AsnLineDto } from '@/lib/wms-api/types/wms-api'

interface ReceiveAsnWizardProps {
  onSuccess?: () => void
}

const asnStatusBadgeVariant = (status: string) => {
  const map: Record<string, 'outline' | 'secondary' | 'default' | 'destructive' | 'success'> = {
    CREATED: 'secondary',
    CONFIRMED: 'default',
    IN_TRANSIT: 'default',
    ARRIVED: 'default',
    IN_RECEIVING: 'success',
    PARTIALLY_RECEIVED: 'success',
    RECEIVED: 'success',
    CLOSED: 'outline',
    CANCELLED: 'destructive',
  }
  return map[status] ?? 'outline'
}

const receivableStatuses = ['CREATED', 'CONFIRMED', 'IN_TRANSIT', 'ARRIVED', 'IN_RECEIVING', 'PARTIALLY_RECEIVED']

export function ReceiveAsnWizard({ onSuccess }: ReceiveAsnWizardProps) {
  const [step, setStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [submittedAsnNumber, setSubmittedAsnNumber] = useState('')
  const [selectedAsnId, setSelectedAsnId] = useState<number | null>(null)

  const { data: asnSearchResult, isLoading: searching } = useAsnByNumber(submittedAsnNumber)
  const { data: asnWithLines, isLoading: loadingLines } = useAsnWithLines(selectedAsnId)
  const { data: locations = [] } = useLocations()

  const createReceipt = useCreateGoodsReceipt()
  const receiveLine = useReceiveLine()
  const completeReceipt = useCompleteReceipt()

  const { selectedClient } = useClientStore()

  const locationOptions = useMemo(
    () =>
      locations.map((loc) => ({
        value: loc.location_id ?? 0,
        label: (loc as unknown as { location_name?: string }).location_name ?? `Location #${loc.location_id}`,
      })),
    [locations],
  )

  const form = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveFormSchema),
    defaultValues: { asn_id: 0, asn_number: '', lines: [] },
    mode: 'onChange',
  })

  const { fields, replace } = useFieldArray({ control: form.control, name: 'lines' })

  useEffect(() => {
    if (asnSearchResult && receivableStatuses.includes(asnSearchResult.status)) {
      setSelectedAsnId(asnSearchResult.asn_id)
    }
  }, [asnSearchResult])

  useEffect(() => {
    if (asnWithLines?.lines && asnWithLines?.asn) {
      form.setValue('asn_id', asnWithLines.asn.asn_id)
      form.setValue('asn_number', asnWithLines.asn.asn_number)
      replace(
        asnWithLines.lines.map((line: AsnLineDto) => ({
          asn_line_id: line.asn_line_id,
          product_id: line.product_id,
          uom_id: line.uom_id,
          expected_quantity: line.expected_quantity,
          received_quantity: 0,
          staging_location_id: 0,
          lot_number: '',
          expiry_date: '',
          notes: '',
        })),
      )
    }
  }, [asnWithLines, form, replace])

  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      setSubmittedAsnNumber(searchTerm.trim())
      setSelectedAsnId(null)
    }
  }, [searchTerm])

  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!asnSearchResult || !receivableStatuses.includes(asnSearchResult.status)) return
      setStep(2)
    }
    if (step === 2) {
      const valid = await form.trigger('lines')
      if (!valid) return
      setStep(3)
    }
  }, [step, asnSearchResult, form])

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1)
  }, [step])

  const handleReset = useCallback(() => {
    setStep(1)
    setSearchTerm('')
    setSubmittedAsnNumber('')
    setSelectedAsnId(null)
    form.reset({ asn_id: 0, asn_number: '', lines: [] })
  }, [form])

  const isSubmitting = createReceipt.isPending || receiveLine.isPending || completeReceipt.isPending

  const handleSubmit = useCallback(async () => {
    const values = form.getValues()
    if (values.lines.length === 0) return

    const facilityId = Number(localStorage.getItem('facility_id')) || 0

    try {
      const result = await createReceipt.mutateAsync({
        asn_number: values.asn_number,
        facility_id: facilityId,
        inbound_for_client_id: selectedClient ? Number(selectedClient.id) : undefined,
      })

      const receiptId = result.receipt_id ?? 0

      for (const line of values.lines) {
        await receiveLine.mutateAsync({
          receiptId,
          dto: {
            product_id: line.product_id,
            received_quantity: line.received_quantity,
            uom_id: line.uom_id,
            asn_line_id: line.asn_line_id,
            staging_location_id: line.staging_location_id,
            lot_number: line.lot_number || undefined,
            expiry_date: line.expiry_date || undefined,
            notes: line.notes || undefined,
          },
        })
      }

      await completeReceipt.mutateAsync(receiptId)

      onSuccess?.()
      handleReset()
    } catch {
      // errors handled by onError in each mutation
    }
  }, [form, selectedClient, createReceipt, receiveLine, completeReceipt, onSuccess, handleReset])

  const asn = asnSearchResult
  const lines = asnWithLines?.lines ?? []

  const renderStep1 = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Enter the ASN number to begin receiving. Only ASNs with receivable status can be received.
      </p>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search ASN number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
          />
        </div>
        <Button onClick={handleSearch} disabled={!searchTerm.trim() || searching}>
          {searching ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
          Search
        </Button>
      </div>

      {submittedAsnNumber && !searching && asn === null && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircleIcon className="h-4 w-4" />
          No ASN found with number &quot;{submittedAsnNumber}&quot;
        </div>
      )}

      {asn && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>ASN {asn.asn_number}</span>
              <Badge variant={asnStatusBadgeVariant(asn.status)}>{asn.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Client: </span>
              {asn.client_name ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Vendor: </span>
              {asn.vendor_name ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">PO: </span>
              {asn.po_number ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Expected: </span>
              {asn.expected_arrival_date ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Carrier: </span>
              {asn.carrier_name ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Tracking: </span>
              {asn.tracking_number ?? '-'}
            </div>
          </CardContent>
        </Card>
      )}

      {asn && !receivableStatuses.includes(asn.status) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircleIcon className="h-4 w-4" />
          ASN status &quot;{asn.status}&quot; is not receivable. Expected: {receivableStatuses.join(', ')}
        </div>
      )}
    </div>
  )

  const renderStep2 = () => {
    if (loadingLines) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-6 w-6 animate-spin" />
        </div>
      )
    }

    if (!asnWithLines || lines.length === 0) {
      return <p className="text-sm text-muted-foreground">No lines found for this ASN.</p>
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-2 font-medium">Product</th>
                <th className="pb-2 pr-2 font-medium">Expected</th>
                <th className="pb-2 pr-2 font-medium">UOM</th>
                <th className="pb-2 pr-2 font-medium">Received *</th>
                <th className="pb-2 pr-2 font-medium">Location *</th>
                <th className="pb-2 pr-2 font-medium">Lot #</th>
                <th className="pb-2 pr-2 font-medium">Expiry</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const line = lines[index]
                return (
                  <tr key={field.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 align-top pt-3">
                      <span className="text-sm font-medium">{line?.product_name ?? `Product #${line?.product_id}`}</span>
                    </td>
                    <td className="py-2 pr-2 align-top pt-3">
                      <span className="text-sm">{line?.expected_quantity ?? '-'}</span>
                    </td>
                    <td className="py-2 pr-2 align-top pt-3">
                      <span className="text-sm">{line?.uom_name ?? '-'}</span>
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.received_quantity`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                placeholder="Qty"
                                className="w-24"
                                value={f.value || ''}
                                onChange={(e) => f.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.staging_location_id`}
                        render={({ field: f }) => (
                          <FormItem>
                            <Select
                              onValueChange={(v) => f.onChange(v ? Number(v) : 0)}
                              value={f.value ? String(f.value) : ''}
                            >
                              <FormControl>
                                <SelectTrigger className="w-36 overflow-hidden">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {locationOptions.map((opt) => (
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
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.lot_number`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Lot #" className="w-24" value={f.value || ''} onChange={(e) => f.onChange(e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="py-2 pr-2 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.expiry_date`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="date" className="w-36" value={f.value || ''} onChange={(e) => f.onChange(e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="py-2 align-top">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.notes`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Notes" className="w-28" value={f.value || ''} onChange={(e) => f.onChange(e.target.value)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderStep3 = () => {
    const values = form.getValues()
    const totalExpected = lines.reduce((sum, l) => sum + l.expected_quantity, 0)
    const totalReceived = values.lines.reduce((sum, l) => sum + l.received_quantity, 0)

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receipt Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ASN: </span>
              {asn?.asn_number ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Client: </span>
              {asn?.client_name ?? '-'}
            </div>
            <div>
              <span className="text-muted-foreground">Total Lines: </span>
              {lines.length}
            </div>
            <div>
              <span className="text-muted-foreground">Total Expected: </span>
              {totalExpected}
            </div>
            <div>
              <span className="text-muted-foreground">Total Receiving: </span>
              {totalReceived}
            </div>
            <div>
              <span className="text-muted-foreground">Facility: </span>
              {asn?.facility_name ?? '-'}
            </div>
          </CardContent>
        </Card>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-2 font-medium">Product</th>
                <th className="pb-2 pr-2 font-medium">Expected</th>
                <th className="pb-2 pr-2 font-medium">Receiving</th>
                <th className="pb-2 pr-2 font-medium">Location</th>
                <th className="pb-2 pr-2 font-medium">Lot #</th>
                <th className="pb-2 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {values.lines.map((line, index) => {
                const asnLine = lines[index]
                const loc = locationOptions.find((l) => l.value === line.staging_location_id)
                return (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 pr-2">{asnLine?.product_name ?? `Product #${line.product_id}`}</td>
                    <td className="py-2 pr-2">{line.expected_quantity}</td>
                    <td className="py-2 pr-2 font-medium">{line.received_quantity}</td>
                    <td className="py-2 pr-2">{loc?.label ?? '-'}</td>
                    <td className="py-2 pr-2">{line.lot_number || '-'}</td>
                    <td className="py-2">{line.expiry_date || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        {step > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span className={`flex items-center gap-1 ${step >= 2 ? 'text-primary font-medium' : ''}`}>
              <CheckCircle2Icon className="h-4 w-4" /> ASN Selected
            </span>
            <span className="mx-2">/</span>
            <span className={`flex items-center gap-1 ${step >= 3 ? 'text-primary font-medium' : ''}`}>
              {step >= 3 ? <CheckCircle2Icon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />} Receipt Details
            </span>
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (step === 1 && (!asnSearchResult || !receivableStatuses.includes(asnSearchResult.status)))
                }
              >
                Next <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin mr-1" /> Submitting...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1" /> Complete Receipt
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Form>
  )
}
