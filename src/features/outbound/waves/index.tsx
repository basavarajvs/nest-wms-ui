import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, RefreshCw } from 'lucide-react'

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import { useWaveBoard, useCreateWave, type WaveTask } from './data/wave-queries'

const waveSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
})

type WaveForm = z.infer<typeof waveSchema>

export function Waves() {
  const [statusFilter, setStatusFilter] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const params = { status: statusFilter, facilityId: facilityFilter }
  const { data, isLoading, error, refetch, isFetching } = useWaveBoard(params)
  const createMutation = useCreateWave()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaveForm>({
    resolver: zodResolver(waveSchema) as any,
    defaultValues: { facilityId: '' },
  })

  const waves: WaveTask[] = data?.waves || []

  const grouped = waves.reduce((acc, w) => {
    const s = w.status || 'unknown'
    if (!acc[s]) acc[s] = []
    acc[s].push(w)
    return acc
  }, {} as Record<string, WaveTask[]>)

  const onCreate = async (formData: WaveForm) => {
    try {
      await createMutation.mutateAsync({
        facilityId: formData.facilityId,
      })
      toast.success('Picking Wave created')
      setDialogOpen(false)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create wave')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Picking Waves</h1>
          <p className="text-muted-foreground">Wave planning and picking board</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Wave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Picking Wave</DialogTitle>
                <DialogDescription>Provide facility to generate a new wave.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
                <div>
                  <Label htmlFor="facilityId">Facility ID *</Label>
                  <Input id="facilityId" {...register('facilityId')} placeholder="facility-uuid" />
                  {errors.facilityId && <p className="text-sm text-destructive">{errors.facilityId.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Wave'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Input value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="pending, in_progress..." />
            </div>
            <div>
              <Label>Facility ID</Label>
              <Input value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} placeholder="facility-uuid" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setStatusFilter(''); setFacilityFilter('') }} className="w-full">Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board */}
      <Card>
        <CardHeader>
          <CardTitle>Wave Board ({waves.length} tasks)</CardTitle>
          <CardDescription>Real data from OutboundWebController_getWaveBoard</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : error ? (
            <div className="text-destructive">Failed to load wave board.</div>
          ) : waves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No wave tasks for current filters.</div>
          ) : (
            <div className="space-y-6">
              {/* Grouped cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(grouped).map(([status, list]) => (
                  <div key={status} className="rounded border p-3">
                    <div className="flex justify-between mb-2">
                      <Badge variant="secondary">{status}</Badge>
                      <span className="text-xs text-muted-foreground">{list.length}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {list.slice(0, 4).map((t, i) => (
                        <div key={i} className="rounded bg-muted p-2 text-xs">
                          {t.orderId ? `Order: ${t.orderId}` : 'Task'}
                          {t.productId && ` • ${t.productId}`}
                          {t.quantity != null && ` ×${t.quantity}`}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waves.map((w, i) => (
                      <TableRow key={w.id || i}>
                        <TableCell className="font-mono text-xs">{w.id || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{w.orderId || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{w.productId || '—'}</TableCell>
                        <TableCell>{w.quantity ?? '—'}</TableCell>
                        <TableCell><Badge variant="outline">{w.status || '—'}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{w.assignedToUserId || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Waves
