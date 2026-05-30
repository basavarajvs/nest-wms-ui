import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RefreshCw, ClipboardX } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdjustments,
  useCreateAdjustment,
  useSubmitAdjustment,
  useApproveAdjustment,
  type Adjustment,
} from '@/features/inventory/adjustments/data/adjustment-queries'
import { useFacility } from '@/hooks/useFacility'

const adjustmentSchema = z.object({
  reasonCode: z.string().min(1, 'Reason code is required'),
  notes: z.string().optional(),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'posted', label: 'Posted' },
]

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  submitted: 'default',
  approved: 'default',
  rejected: 'destructive',
  posted: 'outline',
}

export function AdjustmentList() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useAdjustments({
    page,
    limit,
    status: statusFilter,
  })
  const createMutation = useCreateAdjustment()
  const submitMutation = useSubmitAdjustment()
  const approveMutation = useApproveAdjustment()
  const { selectedFacility } = useFacility()

  const form = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { reasonCode: '', notes: '' },
  })

  const adjustments: Adjustment[] = data?.adjustments || []
  const total = data?.total ?? adjustments.length
  const totalPages = Math.ceil(total / limit)

  const onCreateSubmit = async (formData: AdjustmentForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
        reasonCode: formData.reasonCode,
        notes: formData.notes || undefined,
      })
      toast.success('Adjustment created (draft)')
      setDialogOpen(false)
      form.reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create adjustment')
    }
  }

  const handleSubmit = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id)
      toast.success('Adjustment submitted for approval')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Submit failed')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id)
      toast.success('Adjustment approved')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Approve failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Adjustments</h1>
          <p className="text-muted-foreground">
            Create, submit, and approve stock corrections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setStatusFilter(''); setPage(1) }} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Adjustments {total ? `(${total})` : ''}</CardTitle>
          <CardDescription>
            {selectedFacility ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}` : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load adjustments</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : adjustments.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <ClipboardX className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No adjustments found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter ? 'No adjustments match the current status filter.' : 'Create a new adjustment to get started.'}
              </p>
              {(statusFilter) && (
                <Button variant="outline" size="sm" onClick={() => { setStatusFilter(''); setPage(1) }}>Clear Filters</Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference / ID</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">
                          {adj.reference || adj.id.substring(0, 12) + '...'}
                        </TableCell>
                        <TableCell>
                          <div>{adj.reasonCode || adj.reason || '—'}</div>
                          {adj.notes && <div className="line-clamp-1 text-xs text-muted-foreground">{adj.notes}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[adj.status || 'draft'] || 'secondary'}>
                            {adj.status || 'draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {adj.createdAt ? new Date(adj.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {adj.status === 'draft' && (
                              <Button size="sm" variant="outline" onClick={() => handleSubmit(adj.id)}>Submit</Button>
                            )}
                            {adj.status === 'submitted' && (
                              <>
                                <Button size="sm" onClick={() => handleApprove(adj.id)}>Approve</Button>
                                <Button size="sm" variant="outline" disabled title="Reject endpoint not available in current API">
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={form.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Inventory Adjustment</DialogTitle>
              <DialogDescription>
                Provide reason code and facility. Lines may be added after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedFacility && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="reasonCode">Reason Code *</Label>
                <Input id="reasonCode" {...form.register('reasonCode')} placeholder="e.g. DAMAGE, CYCLE_COUNT" />
                {form.formState.errors.reasonCode && <p className="text-sm text-destructive">{form.formState.errors.reasonCode.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register('notes')} rows={3} placeholder="Optional details..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Draft'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
