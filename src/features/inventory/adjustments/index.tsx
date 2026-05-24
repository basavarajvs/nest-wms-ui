import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import {
  useAdjustments,
  useCreateAdjustment,
  useSubmitAdjustment,
  useApproveAdjustment,
  type Adjustment,
} from './data/adjustment-queries'

const adjustmentSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  reasonCode: z.string().min(1, 'Reason code is required'),
  notes: z.string().optional(),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

const STATUS_OPTIONS = ['', 'draft', 'submitted', 'approved', 'rejected', 'posted']

export function Adjustments() {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const params = { page, limit, status: statusFilter, facilityId: facilityFilter }

  const { data, isLoading, error, refetch, isFetching } = useAdjustments(params)
  const createMutation = useCreateAdjustment()
  const submitMutation = useSubmitAdjustment()
  const approveMutation = useApproveAdjustment()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema) as any,
    defaultValues: { facilityId: '', reasonCode: '', notes: '' },
  })

  const adjustments: Adjustment[] = data?.adjustments || []

  const onCreateSubmit = async (formData: AdjustmentForm) => {
    try {
      await createMutation.mutateAsync({
        facilityId: formData.facilityId,
        reasonCode: formData.reasonCode,
        notes: formData.notes || undefined,
      })
      toast.success('Adjustment created (draft)')
      setDialogOpen(false)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create adjustment')
    }
  }

  const handleSubmitAdj = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id)
      toast.success('Adjustment submitted for approval')
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Submit failed')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id)
      toast.success('Adjustment approved')
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Approve failed')
    }
  }

  const handleRefresh = () => refetch()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Adjustments</h1>
          <p className="text-muted-foreground">Create, submit, and approve stock corrections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Inventory Adjustment</DialogTitle>
                <DialogDescription>Provide reason code and facility. Lines may be added after creation in a future iteration.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="facilityId">Facility ID *</Label>
                  <Input id="facilityId" {...register('facilityId')} placeholder="facility-uuid" />
                  {errors.facilityId && <p className="text-sm text-destructive">{errors.facilityId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="reasonCode">Reason Code *</Label>
                  <Input id="reasonCode" {...register('reasonCode')} placeholder="e.g. DAMAGE, CYCLE_COUNT, RECEIPT_ERROR" />
                  {errors.reasonCode && <p className="text-sm text-destructive">{errors.reasonCode.message}</p>}
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" {...register('notes')} placeholder="Optional details..." />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Draft'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Status</Label>
              <select
                className="w-48 rounded border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || 'All'}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Facility ID</Label>
              <Input
                className="w-64"
                value={facilityFilter}
                onChange={(e) => { setFacilityFilter(e.target.value); setPage(1) }}
                placeholder="facility-uuid"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setStatusFilter(''); setFacilityFilter(''); setPage(1) }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjustments {data?.total ? `(${data.total})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : error ? (
            <div className="text-destructive">Failed to load adjustments.</div>
          ) : adjustments.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">No adjustments found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference / ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="font-mono text-xs">{adj.reference || adj.id}</TableCell>
                    <TableCell>{adj.reasonCode || adj.reason || '—'}<div className="text-xs text-muted-foreground line-clamp-1">{adj.notes}</div></TableCell>
                    <TableCell className="font-mono text-xs">{adj.facilityId}</TableCell>
                    <TableCell><Badge variant={adj.status === 'approved' ? 'default' : 'secondary'}>{adj.status || 'draft'}</Badge></TableCell>
                    <TableCell className="text-xs">{adj.createdAt ? new Date(adj.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {adj.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => handleSubmitAdj(adj.id)}>Submit</Button>
                      )}
                      {adj.status === 'submitted' && (
                        <Button size="sm" onClick={() => handleApprove(adj.id)}>Approve</Button>
                      )}
                      <Button size="sm" variant="ghost" disabled title="Detail view coming later">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
