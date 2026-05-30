import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RefreshCw, ClipboardList, Filter } from 'lucide-react'
import { toast } from 'sonner'
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
  usePendingAllocations,
  useOverrideAllocation,
  type PendingAllocation,
} from '@/features/outbound/allocations/data/allocation-queries'
import { useFacility } from '@/hooks/useFacility'

const overrideSchema = z.object({
  allocationId: z.string().min(1),
  reason: z.string().min(1, 'Reason is required'),
  substituteLocationId: z.string().min(1, 'Substitute location required'),
  substituteLotId: z.string().optional(),
})

type OverrideForm = z.infer<typeof overrideSchema>

export function AllocationList() {
  const [showOverride, setShowOverride] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = usePendingAllocations({
    facilityId: selectedFacility?.id || '',
  })
  const overrideMutation = useOverrideAllocation()

  const allAllocations: PendingAllocation[] = data?.allocations || []
  const total = data?.total ?? allAllocations.length

  const filtered = statusFilter
    ? allAllocations.filter((a) => (a.status || '').toLowerCase().includes(statusFilter.toLowerCase()))
    : allAllocations

  const totalPages = Math.ceil(filtered.length / limit)
  const paged = filtered.slice((page - 1) * limit, page * limit)

  const overrideForm = useForm<OverrideForm>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      allocationId: '',
      reason: '',
      substituteLocationId: '',
      substituteLotId: '',
    },
  })

  const openOverride = (allocationId: string) => {
    setSelectedAllocation(allocationId)
    overrideForm.reset({
      allocationId,
      reason: '',
      substituteLocationId: '',
      substituteLotId: '',
    })
    setShowOverride(true)
  }

  const onOverride = async (formData: OverrideForm) => {
    try {
      await overrideMutation.mutateAsync({
        allocationId: formData.allocationId,
        reason: formData.reason,
        substituteLocationId: formData.substituteLocationId,
        substituteLotId: formData.substituteLotId || undefined,
      })
      toast.success('Allocation overridden successfully')
      setShowOverride(false)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Override failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Allocations</h1>
          <p className="text-muted-foreground">
            Pending inventory allocations for outbound orders
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Input
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                placeholder="Filter by status..."
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setStatusFilter(''); setPage(1) }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pending Allocations ({total})</CardTitle>
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
              <p className="text-destructive font-medium">Failed to load allocations</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No pending allocations</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter
                  ? 'No allocations match the current status filter.'
                  : 'All inventory is fully allocated. Create new orders to generate allocation work.'}
              </p>
              {statusFilter && (
                <Button variant="outline" size="sm" onClick={() => { setStatusFilter(''); setPage(1) }}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Allocation ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">
                          {a.id ? a.id.substring(0, 12) + '...' : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">
                          {a.orderId ? a.orderId.substring(0, 12) + '...' : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{a.productName || a.productSku || a.productId || '—'}</div>
                          {a.productSku && <div className="text-xs text-muted-foreground">{a.productSku}</div>}
                        </TableCell>
                        <TableCell className="text-right font-mono">{a.quantity ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {a.locationId || '—'}
                        </TableCell>
                        <TableCell>{a.status || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openOverride(a.id || '')}
                          >
                            Override
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={overrideForm.handleSubmit(onOverride)}>
            <DialogHeader>
              <DialogTitle>Override Allocation</DialogTitle>
              <DialogDescription>
                Provide a reason and substitute location to override the system allocation
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <input type="hidden" {...overrideForm.register('allocationId')} value={selectedAllocation || ''} />
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input id="reason" {...overrideForm.register('reason')} placeholder="Reason for override" />
                {overrideForm.formState.errors.reason && (
                  <p className="text-sm text-destructive">{overrideForm.formState.errors.reason.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="substituteLocationId">Substitute Location ID *</Label>
                <Input id="substituteLocationId" {...overrideForm.register('substituteLocationId')} placeholder="new-location-uuid" />
                {overrideForm.formState.errors.substituteLocationId && (
                  <p className="text-sm text-destructive">{overrideForm.formState.errors.substituteLocationId.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="substituteLotId">Substitute Lot ID (optional)</Label>
                <Input id="substituteLotId" {...overrideForm.register('substituteLotId')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowOverride(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={overrideMutation.isPending}>
                {overrideMutation.isPending ? 'Overriding...' : 'Confirm Override'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
