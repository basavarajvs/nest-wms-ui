import { useState, useCallback } from 'react'
import { RefreshCw, Filter, Layers, User } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePutawayBoard, type PutawayTask } from '@/features/inbound/putaway-board/data/putaway-queries'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Any Priority' },
  { value: '1', label: '1 (Low)' },
  { value: '2', label: '2' },
  { value: '3', label: '3 (Medium)' },
  { value: '5', label: '5 (High)' },
]

const PRIORITY_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  '1': 'secondary',
  '2': 'outline',
  '3': 'default',
  '5': 'destructive',
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  assigned: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  on_hold: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
}

export function PutawayTaskList() {
  const [status, setStatus] = useState('')
  const [assignedToUserId, setAssignedToUserId] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const params = {
    status,
    assignedToUserId,
    priority: priority === '' ? 0 : Number(priority),
    page,
    limit,
  }
  const { data, isLoading, isError, error, refetch, isFetching } = usePutawayBoard(params)

  const tasks: PutawayTask[] = data?.items || []
  const total = data?.total ?? tasks.length
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit))

  const groupedByStatus = tasks.reduce(
    (acc, task) => {
      const s = task.status || 'unknown'
      if (!acc[s]) acc[s] = []
      acc[s].push(task)
      return acc
    },
    {} as Record<string, PutawayTask[]>
  )

  const handleFilterReset = useCallback(() => {
    setStatus('')
    setAssignedToUserId('')
    setPriority('')
    setPage(1)
    refetch()
    toast.info('Filters reset')
  }, [refetch])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.info('Refreshing putaway board...')
  }, [refetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Putaway Board</h1>
          <p className="text-muted-foreground">
            Real-time view of inbound putaway tasks across all statuses
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isFetching} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Assigned User</label>
              <Input
                value={assignedToUserId}
                onChange={(e) => { setAssignedToUserId(e.target.value); setPage(1) }}
                placeholder="User UUID or leave empty"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleFilterReset} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Putaway Tasks ({tasks.length})
          </CardTitle>
          <CardDescription>
            Tasks grouped by status — showing board overview and detail table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load putaway board</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No putaway tasks found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {status || assignedToUserId || priority
                  ? 'No tasks match the current filters. Try resetting filters.'
                  : 'There are no pending putaway tasks. Create an ASN and GRN to generate putaway work.'}
              </p>
              {(status || assignedToUserId || priority) && (
                <Button variant="outline" size="sm" onClick={handleFilterReset}>
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Object.entries(groupedByStatus).map(([st, list]) => (
                  <div key={st} className="rounded-lg border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`${STATUS_BADGE_COLORS[st] || ''} capitalize`}
                      >
                        {st.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {list.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {list.slice(0, 5).map((t, idx) => (
                        <div
                          key={t.id || idx}
                          className="rounded bg-muted/50 p-2 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate max-w-[120px]">
                              {t.productId || 'Unknown SKU'}
                            </span>
                            {t.priority != null && t.priority > 0 && (
                              <Badge
                                variant={PRIORITY_BADGE_VARIANTS[String(t.priority)] || 'outline'}
                                className="text-[10px] px-1 py-0"
                              >
                                P{t.priority}
                              </Badge>
                            )}
                          </div>
                          {t.quantity != null && (
                            <span className="text-muted-foreground">Qty: {t.quantity}</span>
                          )}
                          {t.suggestedLocationId && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              → {t.suggestedLocationId}
                            </div>
                          )}
                          {t.assignedToUserId && (
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {t.assignedToUserId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      ))}
                      {list.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{list.length - 5} more
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
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="hidden md:table-cell">Suggested Location</TableHead>
                      <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task, index) => (
                      <TableRow key={task.id || index}>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">
                          {task.id ? task.id.substring(0, 12) + '...' : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${STATUS_BADGE_COLORS[task.status || ''] || ''} capitalize`}
                          >
                            {(task.status || '—').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.priority != null && task.priority > 0 ? (
                            <Badge
                              variant={PRIORITY_BADGE_VARIANTS[String(task.priority)] || 'outline'}
                            >
                              {task.priority}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {task.productId || '—'}
                        </TableCell>
                        <TableCell>{task.quantity ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs max-w-[120px] truncate">
                          {task.suggestedLocationId || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {task.assignedToUserId
                            ? task.assignedToUserId.substring(0, 12) + '...'
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({tasks.length} tasks)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
