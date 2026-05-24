import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, FileText, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


import {
  useCreateAsn,
  usePreviewAsn,
  useUpdateAsnStatus,
} from './data/asn-queries'

const asnSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  vendorId: z.string().optional(),
  poNumber: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  expectedArrivalDate: z.string().optional(),
  notes: z.string().optional(),
})

type AsnForm = z.infer<typeof asnSchema>

const statusOptions = ['draft', 'sent', 'in_transit', 'received', 'cancelled']

export function Asns() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toolId, setToolId] = useState('')
  const [toolStatus, setToolStatus] = useState('received')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const createMutation = useCreateAsn()
  const previewMutation = usePreviewAsn()
  const updateStatusMutation = useUpdateAsnStatus()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AsnForm>({
    resolver: zodResolver(asnSchema) as any,
    defaultValues: {
      facilityId: '',
      vendorId: '',
      poNumber: '',
      carrierName: '',
      trackingNumber: '',
      expectedArrivalDate: '',
      notes: '',
    },
  })

  const onCreateSubmit = async (data: AsnForm) => {
    try {
      await createMutation.mutateAsync({
        facilityId: data.facilityId,
        vendorId: data.vendorId || undefined,
        poNumber: data.poNumber || undefined,
        carrierName: data.carrierName || undefined,
        trackingNumber: data.trackingNumber || undefined,
        expectedArrivalDate: data.expectedArrivalDate || undefined,
        notes: data.notes || undefined,
      })
      toast.success('ASN created successfully')
      setDialogOpen(false)
      reset()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create ASN')
    }
  }

  const handlePreview = async () => {
    if (!toolId.trim()) {
      toast.error('Enter an ASN ID')
      return
    }
    setIsPreviewing(true)
    try {
      await previewMutation.mutateAsync(toolId.trim())
      toast.success('ASN preview triggered (check response or downloads)')
    } catch (error: any) {
      toast.error(error?.message || 'Preview failed')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!toolId.trim()) {
      toast.error('Enter an ASN ID')
      return
    }
    setIsUpdating(true)
    try {
      await updateStatusMutation.mutateAsync({
        id: toolId.trim(),
        dto: { status: toolStatus },
      })
      toast.success(`ASN status updated to ${toolStatus}`)
    } catch (error: any) {
      toast.error(error?.message || 'Status update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ASNs</h1>
          <p className="text-muted-foreground">Manage Advance Ship Notices</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New ASN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New ASN</DialogTitle>
              <DialogDescription>Enter ASN details. Required: Facility ID.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="facilityId">Facility ID *</Label>
                <Input id="facilityId" {...register('facilityId')} placeholder="facility-uuid" />
                {errors.facilityId && <p className="text-sm text-destructive">{errors.facilityId.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendorId">Vendor ID</Label>
                  <Input id="vendorId" {...register('vendorId')} placeholder="vendor-uuid" />
                </div>
                <div>
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input id="poNumber" {...register('poNumber')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carrierName">Carrier</Label>
                  <Input id="carrierName" {...register('carrierName')} />
                </div>
                <div>
                  <Label htmlFor="trackingNumber">Tracking #</Label>
                  <Input id="trackingNumber" {...register('trackingNumber')} />
                </div>
              </div>
              <div>
                <Label htmlFor="expectedArrivalDate">Expected Arrival</Label>
                <Input id="expectedArrivalDate" type="date" {...register('expectedArrivalDate')} />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create ASN'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info note about listing */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> ASN listing / findAll is not currently exposed in the Web API client.
            Use the form above to create ASNs. Tools below allow preview and status updates by ID.
          </p>
        </CardContent>
      </Card>

      {/* ASN Tools */}
      <Card>
        <CardHeader>
          <CardTitle>ASN Actions</CardTitle>
          <CardDescription>Preview or update status for an existing ASN by ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="w-full md:w-48">
              <Label htmlFor="toolStatus">New Status</Label>
              <Select value={toolStatus} onValueChange={setToolStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={isPreviewing || !toolId.trim()}
              >
                {isPreviewing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Preview
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={isUpdating || !toolId.trim()}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future list */}
      <Card>
        <CardHeader>
          <CardTitle>ASN List</CardTitle>
          <CardDescription>Will display when listing endpoint is added to the Web API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No ASN listing available yet.
            <br />
            Create new ASNs using the button above.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Asns
