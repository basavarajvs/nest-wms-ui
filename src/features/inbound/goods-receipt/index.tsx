import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Search, RefreshCw } from 'lucide-react'

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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

import {
  useCreateGrnFromAsn,
  useCreateGrnAdHoc,
  useGetGrnProgress,
} from './data/grn-queries'

const grnFromAsnSchema = z.object({
  asnNumber: z.string().min(1, 'ASN number is required'),
})

const grnAdHocSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  vendorId: z.string().optional(),
  poNumber: z.string().optional(),
  qcRequired: z.boolean().optional().default(false),
})

type GrnFromAsnForm = z.infer<typeof grnFromAsnSchema>
type GrnAdHocForm = z.infer<typeof grnAdHocSchema>

export function GoodsReceipt() {
  const [fromAsnOpen, setFromAsnOpen] = useState(false)
  const [adHocOpen, setAdHocOpen] = useState(false)
  const [progressId, setProgressId] = useState('')
  const [progressResult, setProgressResult] = useState<any>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)

  const createFromAsn = useCreateGrnFromAsn()
  const createAdHoc = useCreateGrnAdHoc()
  const getProgress = useGetGrnProgress()

  const fromAsnForm = useForm<GrnFromAsnForm>({
    resolver: zodResolver(grnFromAsnSchema) as any,
    defaultValues: { asnNumber: '' },
  })

  const adHocForm = useForm<GrnAdHocForm>({
    resolver: zodResolver(grnAdHocSchema) as any,
    defaultValues: { facilityId: '', vendorId: '', poNumber: '', qcRequired: false },
  })

  const onCreateFromAsn = async (data: GrnFromAsnForm) => {
    try {
      await createFromAsn.mutateAsync({ asnNumber: data.asnNumber })
      toast.success('GRN created from ASN')
      setFromAsnOpen(false)
      fromAsnForm.reset()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create GRN from ASN')
    }
  }

  const onCreateAdHoc = async (data: GrnAdHocForm) => {
    try {
      await createAdHoc.mutateAsync({
        facilityId: data.facilityId,
        vendorId: data.vendorId || undefined,
        poNumber: data.poNumber || undefined,
        qcRequired: data.qcRequired,
      })
      toast.success('Ad-hoc GRN created')
      setAdHocOpen(false)
      adHocForm.reset()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create ad-hoc GRN')
    }
  }

  const handleViewProgress = async () => {
    if (!progressId.trim()) {
      toast.error('Enter a GRN ID')
      return
    }
    setIsLoadingProgress(true)
    setProgressResult(null)
    try {
      const res = await getProgress.mutateAsync(progressId.trim())
      setProgressResult(res)
      toast.success('GRN progress loaded')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load GRN progress')
    } finally {
      setIsLoadingProgress(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goods Receipt (GRN)</h1>
          <p className="text-muted-foreground">Create and view Goods Receipt Notes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={fromAsnOpen} onOpenChange={setFromAsnOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                GRN from ASN
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create GRN from ASN</DialogTitle>
                <DialogDescription>Provide the ASN number to generate a GRN.</DialogDescription>
              </DialogHeader>
              <form onSubmit={fromAsnForm.handleSubmit(onCreateFromAsn)} className="space-y-4">
                <div>
                  <Label htmlFor="asnNumber">ASN Number *</Label>
                  <Input id="asnNumber" {...fromAsnForm.register('asnNumber')} placeholder="ASN-12345 or UUID" />
                  {fromAsnForm.formState.errors.asnNumber && (
                    <p className="text-sm text-destructive">{fromAsnForm.formState.errors.asnNumber.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setFromAsnOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createFromAsn.isPending}>
                    {createFromAsn.isPending ? 'Creating...' : 'Create GRN'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={adHocOpen} onOpenChange={setAdHocOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ad-hoc GRN
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Ad-hoc GRN</DialogTitle>
                <DialogDescription>Direct goods receipt without prior ASN.</DialogDescription>
              </DialogHeader>
              <form onSubmit={adHocForm.handleSubmit(onCreateAdHoc)} className="space-y-4">
                <div>
                  <Label htmlFor="facilityId">Facility ID *</Label>
                  <Input id="facilityId" {...adHocForm.register('facilityId')} placeholder="facility-uuid" />
                  {adHocForm.formState.errors.facilityId && (
                    <p className="text-sm text-destructive">{adHocForm.formState.errors.facilityId.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendorId">Vendor ID</Label>
                    <Input id="vendorId" {...adHocForm.register('vendorId')} />
                  </div>
                  <div>
                    <Label htmlFor="poNumber">PO Number</Label>
                    <Input id="poNumber" {...adHocForm.register('poNumber')} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="qcRequired"
                    checked={adHocForm.watch('qcRequired')}
                    onCheckedChange={(checked) => adHocForm.setValue('qcRequired', !!checked)}
                  />
                  <Label htmlFor="qcRequired">QC Required</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAdHocOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAdHoc.isPending}>
                    {createAdHoc.isPending ? 'Creating...' : 'Create GRN'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Full GRN listing is not exposed in the current Web API. Use the creation forms above.
            View progress for a specific GRN below.
          </p>
        </CardContent>
      </Card>

      {/* GRN Progress Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>View GRN Progress</CardTitle>
          <CardDescription>Fetch detailed progress for a GRN by ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={progressId}
              onChange={(e) => setProgressId(e.target.value)}
              placeholder="Enter GRN ID"
              className="max-w-md"
            />
            <Button onClick={handleViewProgress} disabled={isLoadingProgress || !progressId.trim()}>
              {isLoadingProgress ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Load Progress
            </Button>
          </div>

          {isLoadingProgress && <Skeleton className="h-32 w-full" />}

          {progressResult && (
            <div className="rounded-md border bg-muted p-4">
              <pre className="text-xs overflow-auto max-h-64">
                {JSON.stringify(progressResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder list */}
      <Card>
        <CardHeader>
          <CardTitle>GRN List</CardTitle>
          <CardDescription>Will appear when a list endpoint is added to the Web API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No GRN listing available in current client.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GoodsReceipt
