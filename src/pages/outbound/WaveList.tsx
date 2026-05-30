import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RefreshCw } from 'lucide-react'
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
import { useWaveBoard, useCreateWave, type WaveTask } from '@/features/outbound/waves/data/wave-queries'
import { useFacility } from '@/hooks/useFacility'

const waveSchema = z.object({})

type WaveForm = z.infer<typeof waveSchema>

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  on_hold: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
}

export function WaveList() {
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: waves, isLoading, isError, error, refetch, isFetching } = useWaveBoard({
    status: statusFilter,
  })
  const createMutation = useCreateWave()
  const { selectedFacility } = useFacility()

  const form = useForm<WaveForm>({
    resolver: zodResolver(waveSchema),
    defaultValues: {},
  })

  const waveTasks: WaveTask[] = waves || []

  const grouped = waveTasks.reduce(
    (acc, w) => {
      const s = w.status || 'unknown'
      if (!acc[s]) acc[s] = []
      acc[s].push(w)
      return acc
    },
    {} as Record<string, WaveTask[]>
  )

  const onCreate = async () => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
      })
      toast.success('Picking Wave created successfully')
      setDialogOpen(false)
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create wave')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Picking Waves</h1>
          <p className="text-muted-foreground">
            Wave planning and picking board
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Wave
            </Button>
            <DialogContent className="sm:max-w-[440px]">
              <form onSubmit={form.handleSubmit(onCreate)}>
                <DialogHeader>
                  <DialogTitle>Create Picking Wave</DialogTitle>
                  <DialogDescription>
                    Generate a new picking wave for the selected facility
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {selectedFacility && (
                    <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
                    </div>
                  )}
                  {!selectedFacility && (
                    <p className="text-sm text-muted-foreground">
                      Select a facility from the top bar first
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || !selectedFacility}>
                    {createMutation.isPending ? 'Creating...' : 'Create Wave'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Input
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="e.g. pending, in_progress..."
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setStatusFilter('')} className="w-full">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Wave Board ({waveTasks.length} tasks)</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load wave board</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : waveTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">No wave tasks found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter
                  ? 'No tasks match the current filter. Try clearing filters.'
                  : 'Create a wave to generate pick tasks.'}
              </p>
              {statusFilter && (
                <Button variant="outline" size="sm" onClick={() => setStatusFilter('')}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                {Object.entries(grouped).map(([status, list]) => (
                  <div key={status} className="rounded-lg border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`${STATUS_BADGE_COLORS[status] || ''} capitalize`}
                      >
                        {status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {list.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {list.slice(0, 4).map((t, idx) => (
                        <div key={t.id || idx} className="rounded bg-muted/50 p-2 text-xs space-y-0.5">
                          <div className="font-medium truncate">
                            {t.orderId ? `Order: ${t.orderId.substring(0, 12)}...` : 'Task'}
                          </div>
                          {t.productId && (
                            <div className="text-muted-foreground truncate">{t.productId}</div>
                          )}
                          {t.quantity != null && (
                            <div className="text-muted-foreground">Qty: {t.quantity}</div>
                          )}
                        </div>
                      ))}
                      {list.length > 4 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{list.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waveTasks.map((w, i) => (
                      <TableRow key={w.id || i}>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">
                          {w.id ? w.id.substring(0, 12) + '...' : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">
                          {w.orderId || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[100px] truncate">
                          {w.productId || '—'}
                        </TableCell>
                        <TableCell>{w.quantity ?? '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${STATUS_BADGE_COLORS[w.status || ''] || ''} capitalize`}
                          >
                            {(w.status || '—').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {w.assignedToUserId
                            ? w.assignedToUserId.substring(0, 12) + '...'
                            : '—'}
                        </TableCell>
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
