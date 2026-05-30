import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Truck, FileText, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useShipments,
  useGenerateManifest,
  type Shipment,
} from '@/features/outbound/shipments/data/shipment-queries'
import { useFacility } from '@/hooks/useFacility'

const manifestSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  carrierCode: z.string().optional(),
})

type ManifestForm = z.infer<typeof manifestSchema>

const SHIPMENT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'loaded', label: 'Loaded' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
]

export function ShipmentList() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [manifestResult, setManifestResult] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = useShipments({
    facilityId: selectedFacility?.id || '',
    status: statusFilter || undefined,
    page,
    limit,
  })
  const generateMutation = useGenerateManifest()

  const shipments: Shipment[] = data?.shipments || []

  const form = useForm<ManifestForm>({
    resolver: zodResolver(manifestSchema),
    defaultValues: { shipmentId: '', carrierCode: '' },
  })

  const onGenerate = async (formData: ManifestForm) => {
    try {
      const res = await generateMutation.mutateAsync({
        shipmentId: formData.shipmentId,
        carrierCode: formData.carrierCode || undefined,
      })
      setManifestResult(res)
      toast.success('Manifest generated successfully')
      setDialogOpen(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate manifest')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">
            Manage outbound shipments and generate carrier manifests
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Manifest
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {SHIPMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setStatusFilter(''); setPage(1) }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6 text-sm text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Shipment Listing</p>
              <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                Full shipment listing is not currently exposed in the Web API client.
                The primary outbound shipment action available is manifest generation
                (use the button above). Once available, shipments will appear below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Outbound Shipments</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load shipments</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : shipments.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Truck className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="text-muted-foreground">No shipments to display</p>
                <p className="text-sm text-muted-foreground max-w-lg mt-1">
                  Shipments are created automatically when orders are released to waves and picked.
                  Use the manifest generator above for existing shipment IDs.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipment ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Tracking #</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">
                          {s.id.substring(0, 12) + '...'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.orderNumber || (s.orderId ? s.orderId.substring(0, 12) + '...' : '—')}
                        </TableCell>
                        <TableCell>{s.carrierCode || s.carrierName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'dispatched' ? 'default' : s.status === 'delivered' ? 'secondary' : 'outline'}>
                            {s.status || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {s.trackingNumber || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Page {page}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Quick Manifest
          </CardTitle>
          <CardDescription>
            Generate a carrier manifest by entering a shipment ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Input
                value={form.watch('shipmentId')}
                onChange={(e) => form.setValue('shipmentId', e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') form.handleSubmit(onGenerate)() }}
                placeholder="Enter shipment ID..."
              />
            </div>
            <Button
              onClick={form.handleSubmit(onGenerate)}
              disabled={generateMutation.isPending || !form.watch('shipmentId')}
            >
              {generateMutation.isPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          {generateMutation.isPending && (
            <Skeleton className="mt-4 h-24 w-full" />
          )}

          {manifestResult && (
            <div className="mt-6 rounded-md border bg-muted p-4">
              <div className="mb-2 font-medium text-sm">Manifest Result</div>
              <pre className="max-h-64 overflow-auto text-xs font-mono">
                {JSON.stringify(manifestResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={form.handleSubmit(onGenerate)}>
            <DialogHeader>
              <DialogTitle>Generate Manifest</DialogTitle>
              <DialogDescription>
                Generate a carrier manifest for a completed outbound shipment
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="shipmentId">Shipment ID *</Label>
                <Input id="shipmentId" {...form.register('shipmentId')} placeholder="shipment-uuid or number" />
                {form.formState.errors.shipmentId && (
                  <p className="text-sm text-destructive">{form.formState.errors.shipmentId.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="carrierCode">Carrier Code</Label>
                <Input id="carrierCode" {...form.register('carrierCode')} placeholder="e.g. DHL, UPS, FEDEX" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generating...' : 'Generate Manifest'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {manifestResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Last Manifest Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md border bg-muted p-4 text-xs font-mono">
              {JSON.stringify(manifestResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
