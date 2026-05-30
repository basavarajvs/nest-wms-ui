import { useState, useCallback } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, RefreshCw, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
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
  useCreateGrnFromAsn,
  useCreateGrnAdHoc,
  useGrnProgress,
} from '@/features/inbound/goods-receipt/data/grn-queries'
import { useFacility } from '@/hooks/useFacility'

const grnFromAsnSchema = z.object({
  asnNumber: z.string().min(1, 'ASN number is required'),
})

const grnAdHocSchema = z.object({
  vendorId: z.string().optional(),
  poNumber: z.string().optional(),
  qcRequired: z.boolean().optional().default(false),
})

type GrnFromAsnForm = z.infer<typeof grnFromAsnSchema>
type GrnAdHocForm = z.infer<typeof grnAdHocSchema>

export function GrnList() {
  const [fromAsnOpen, setFromAsnOpen] = useState(false)
  const [adHocOpen, setAdHocOpen] = useState(false)
  const [progressInput, setProgressInput] = useState('')
  const [activeProgressId, setActiveProgressId] = useState('')

  const createFromAsn = useCreateGrnFromAsn()
  const createAdHoc = useCreateGrnAdHoc()
  const { data: progressData, isLoading: progressLoading, isError: progressError, error: progressErr, refetch: refetchProgress } = useGrnProgress(activeProgressId)
  const { selectedFacility } = useFacility()

  const fromAsnForm = useForm<GrnFromAsnForm>({
    resolver: zodResolver(grnFromAsnSchema),
    defaultValues: { asnNumber: '' },
  })

  const adHocForm = useForm<GrnAdHocForm>({
    resolver: zodResolver(grnAdHocSchema),
    defaultValues: {
      vendorId: '',
      poNumber: '',
      qcRequired: false,
    },
  })

  const onCreateFromAsn = useCallback(async (values: GrnFromAsnForm) => {
    try {
      await createFromAsn.mutateAsync({ asnNumber: values.asnNumber })
      toast.success('GRN created from ASN successfully')
      setFromAsnOpen(false)
      fromAsnForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create GRN from ASN')
    }
  }, [createFromAsn, fromAsnForm])

  const onCreateAdHoc = useCallback(async (values: GrnAdHocForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createAdHoc.mutateAsync({
        facilityId: selectedFacility.id,
        vendorId: values.vendorId || undefined,
        poNumber: values.poNumber || undefined,
        qcRequired: values.qcRequired,
      })
      toast.success('Ad-hoc GRN created successfully')
      setAdHocOpen(false)
      adHocForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create ad-hoc GRN')
    }
  }, [createAdHoc, adHocForm, selectedFacility])

  const handleLoadProgress = useCallback(() => {
    if (!progressInput.trim()) {
      toast.error('Enter a GRN ID')
      return
    }
    setActiveProgressId(progressInput.trim())
  }, [progressInput])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes</h1>
          <p className="text-muted-foreground">
            Create and track Goods Receipt Notes for inbound shipments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={fromAsnOpen} onOpenChange={setFromAsnOpen}>
            <Button variant="outline" onClick={() => setFromAsnOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              GRN from ASN
            </Button>
            <DialogContent className="sm:max-w-[440px]">
              <form onSubmit={fromAsnForm.handleSubmit(onCreateFromAsn)}>
                <DialogHeader>
                  <DialogTitle>Create GRN from ASN</DialogTitle>
                  <DialogDescription>
                    Generate a Goods Receipt Note from an existing Advance Ship Notice
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="asnNumber">ASN Number *</Label>
                    <Input
                      id="asnNumber"
                      {...fromAsnForm.register('asnNumber')}
                      placeholder="ASN-12345 or UUID"
                    />
                    {fromAsnForm.formState.errors.asnNumber && (
                      <p className="text-sm text-destructive">{fromAsnForm.formState.errors.asnNumber.message}</p>
                    )}
                  </div>
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
            <Button onClick={() => setAdHocOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ad-hoc GRN
            </Button>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={adHocForm.handleSubmit(onCreateAdHoc)}>
                <DialogHeader>
                  <DialogTitle>Create Ad-hoc GRN</DialogTitle>
                  <DialogDescription>
                    Direct goods receipt without a prior ASN
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
                      <Label htmlFor="adHocVendor">Vendor ID</Label>
                      <Input id="adHocVendor" {...adHocForm.register('vendorId')} placeholder="vendor-uuid" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="adHocPo">PO Number</Label>
                      <Input id="adHocPo" {...adHocForm.register('poNumber')} placeholder="e.g. PO-001" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="qcRequired"
                      checked={adHocForm.watch('qcRequired')}
                      onCheckedChange={(checked) => adHocForm.setValue('qcRequired', !!checked)}
                    />
                    <Label htmlFor="qcRequired" className="cursor-pointer">QC Required</Label>
                  </div>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>View GRN Progress</CardTitle>
          <CardDescription>
            Look up the detailed progress of a Goods Receipt Note by ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={progressInput}
                onChange={(e) => setProgressInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLoadProgress() }}
                placeholder="Enter GRN ID to load progress..."
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleLoadProgress}
              disabled={!progressInput.trim() || progressLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${progressLoading ? 'animate-spin' : ''}`} />
              {progressLoading ? 'Loading...' : 'Load Progress'}
            </Button>
          </div>

          {progressLoading && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {progressError && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive font-medium">Failed to load GRN progress</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(progressErr as any)?.message || 'An unexpected error occurred'}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchProgress()}>
                  <RefreshCw className="mr-2 h-3 w-3" /> Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {activeProgressId && progressData && !progressLoading && !progressError && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">GRN Progress</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setActiveProgressId(''); setProgressInput('') }}
                  >
                    Clear
                  </Button>
                </div>
                <CardDescription>ID: {activeProgressId}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-80 overflow-auto rounded-md bg-muted p-4 text-xs font-mono">
                  {JSON.stringify(progressData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>GRN List</CardTitle>
          <CardDescription>
            GRN records will be listed here when the backend exposes a list endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No GRN listing available</p>
            <p className="text-sm text-muted-foreground max-w-md">
              The WMS API does not currently expose a list endpoint for GRNs.
              Use the creation buttons above and the progress viewer to manage
              individual receipts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
