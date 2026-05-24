import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import {
  usePendingAllocations,
  useOverrideAllocation,
  type PendingAllocation,
} from './data/allocation-queries'

const overrideSchema = z.object({
  allocationId: z.string().min(1),
  reason: z.string().min(1, 'Reason is required'),
  substituteLocationId: z.string().min(1, 'Substitute location required'),
  substituteLotId: z.string().optional(),
})

type OverrideForm = z.infer<typeof overrideSchema>

export function Allocations() {
  const [facilityFilter, setFacilityFilter] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<string>('')

  const { data, isLoading, error, refetch, isFetching } = usePendingAllocations({ facilityId: facilityFilter })
  const overrideMutation = useOverrideAllocation()

  const allocations: PendingAllocation[] = data?.allocations || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OverrideForm>({
    resolver: zodResolver(overrideSchema) as any,
    defaultValues: { allocationId: '', reason: '', substituteLocationId: '', substituteLotId: '' },
  })

  const openOverride = (allocationId: string) => {
    setSelectedAllocation(allocationId)
    reset({ allocationId, reason: '', substituteLocationId: '', substituteLotId: '' })
    setShowOverride(true)
  }

  const onOverride = async (formData: OverrideForm) => {
    try {
      const overridePayload: any = {
        allocationId: formData.allocationId,
        reason: formData.reason,
        substituteLocationId: formData.substituteLocationId,
      }
      if (formData.substituteLotId) overridePayload.substituteLotId = formData.substituteLotId
      await overrideMutation.mutateAsync(overridePayload)
      toast.success('Allocation overridden')
      setShowOverride(false)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Override failed')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Allocations</h1>
          <p className="text-muted-foreground">Pending inventory allocations for outbound orders</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label>Facility ID</Label>
              <Input value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} placeholder="Filter by facility" />
            </div>
            <Button variant="outline" onClick={() => setFacilityFilter('')}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Allocations ({allocations.length})</CardTitle>
          <CardDescription>From OutboundWebController_getPendingAllocations + override support</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : error ? (
            <div className="text-destructive">Failed to load allocations.</div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending allocations.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allocation ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((a, i) => (
                    <TableRow key={a.id || i}>
                      <TableCell className="font-mono text-xs">{a.id || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{a.orderId || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{a.productId || '—'}</TableCell>
                      <TableCell>{a.quantity ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{a.locationId || '—'}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openOverride(a.id || '')}>
                          Override
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Override Modal */}
      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Allocation</DialogTitle>
            <DialogDescription>Provide reason and substitute location/lot.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onOverride)} className="space-y-4">
            <input type="hidden" {...register('allocationId')} value={selectedAllocation || ''} />
            <div>
              <Label>Reason *</Label>
              <Input {...register('reason')} placeholder="Reason for override" />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>
            <div>
              <Label>Substitute Location ID *</Label>
              <Input {...register('substituteLocationId')} placeholder="new-location-uuid" />
              {errors.substituteLocationId && <p className="text-sm text-destructive">{errors.substituteLocationId.message}</p>}
            </div>
            <div>
              <Label>Substitute Lot ID (optional)</Label>
              <Input {...register('substituteLotId')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowOverride(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Overriding...' : 'Confirm Override'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Allocations
