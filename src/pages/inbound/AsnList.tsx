import { useState, useCallback } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, FileText, RefreshCw, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'
import {
  useCreateAsn,
  usePreviewAsn,
  useUpdateAsnStatus,
} from '@/features/inbound/asns/data/asn-queries'
import { useFacility } from '@/hooks/useFacility'

const createAsnSchema = z.object({
  vendorId: z.string().optional(),
  poNumber: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  expectedArrivalDate: z.string().optional(),
  notes: z.string().optional(),
})

type CreateAsnForm = z.infer<typeof createAsnSchema>

const ASN_STATUS_OPTIONS = ['draft', 'sent', 'in_transit', 'received', 'cancelled']

export function AsnList() {
  const [createOpen, setCreateOpen] = useState(false)
  const [toolId, setToolId] = useState('')
  const [toolStatus, setToolStatus] = useState('received')

  const createMutation = useCreateAsn()
  const previewMutation = usePreviewAsn()
  const updateStatusMutation = useUpdateAsnStatus()
  const { selectedFacility } = useFacility()

  const form = useForm<CreateAsnForm>({
    resolver: zodResolver(createAsnSchema),
    defaultValues: {
      vendorId: '',
      poNumber: '',
      carrierName: '',
      trackingNumber: '',
      expectedArrivalDate: '',
      notes: '',
    },
  })

  const onCreateSubmit = useCallback(async (values: CreateAsnForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
        vendorId: values.vendorId || undefined,
        poNumber: values.poNumber || undefined,
        carrierName: values.carrierName || undefined,
        trackingNumber: values.trackingNumber || undefined,
        expectedArrivalDate: values.expectedArrivalDate || undefined,
        notes: values.notes || undefined,
      })
      toast.success('ASN created successfully')
      setCreateOpen(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create ASN')
    }
  }, [createMutation, form, selectedFacility])

  const handlePreview = useCallback(async () => {
    if (!toolId.trim()) {
      toast.error('Enter an ASN ID')
      return
    }
    try {
      await previewMutation.mutateAsync(toolId.trim())
      toast.success('ASN preview generated successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Preview failed')
    }
  }, [toolId, previewMutation])

  const handleUpdateStatus = useCallback(async () => {
    if (!toolId.trim()) {
      toast.error('Enter an ASN ID')
      return
    }
    try {
      await updateStatusMutation.mutateAsync({
        id: toolId.trim(),
        dto: { status: toolStatus },
      })
      toast.success(`ASN status updated to ${toolStatus}`)
    } catch (err: any) {
      toast.error(err?.message || 'Status update failed')
    }
  }, [toolId, toolStatus, updateStatusMutation])

  const creating = createMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advance Ship Notices</h1>
          <p className="text-muted-foreground">
            Create and manage inbound ASNs from vendors
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New ASN
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Create ASN</CardTitle>
          <CardDescription>
            Register an incoming shipment from a vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the "New ASN" button above to open the creation dialog.
            ASN listing from the API is not yet available — created ASNs
            can be managed via the tools below.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>ASN Actions</CardTitle>
          <CardDescription>
            Preview or update the status of an existing ASN by ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="toolId">ASN ID</Label>
              <Input
                id="toolId"
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                placeholder="Enter ASN UUID or number"
              />
            </div>
            <div className="w-full md:w-44">
              <Label htmlFor="toolStatus">New Status</Label>
              <Select value={toolStatus} onValueChange={setToolStatus}>
                <SelectTrigger id="toolStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASN_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={previewMutation.isPending || !toolId.trim()}
              >
                {previewMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Preview
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending || !toolId.trim()}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>ASN List</CardTitle>
          <CardDescription>
            Recent ASN records will appear here when the list endpoint becomes available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No ASN listing available</p>
            <p className="text-sm text-muted-foreground max-w-md">
              The WMS API does not currently expose a list endpoint for ASNs.
              Use the "New ASN" button to create shipments and the tools above
              to manage them by ID.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={form.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New ASN</DialogTitle>
              <DialogDescription>
                Register an Advance Ship Notice for an incoming delivery
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedFacility && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input id="poNumber" {...form.register('poNumber')} placeholder="e.g. PO-001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vendorId">Vendor ID</Label>
                  <Input id="vendorId" {...form.register('vendorId')} placeholder="vendor-uuid" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="carrierName">Carrier</Label>
                  <Input id="carrierName" {...form.register('carrierName')} placeholder="e.g. FedEx" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trackingNumber">Tracking #</Label>
                  <Input id="trackingNumber" {...form.register('trackingNumber')} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expectedArrivalDate">Expected Arrival</Label>
                <Input id="expectedArrivalDate" type="date" {...form.register('expectedArrivalDate')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register('notes')} rows={3} placeholder="Additional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create ASN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
