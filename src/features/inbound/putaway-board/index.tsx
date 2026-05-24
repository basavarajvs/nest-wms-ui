import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

import { usePutawayBoard, type PutawayTask } from './data/putaway-queries'

const STATUS_OPTIONS = ['', 'pending', 'assigned', 'in_progress', 'completed', 'on_hold']
const PRIORITY_OPTIONS = [0, 1, 2, 3, 5]

export function PutawayBoard() {
  const [status, setStatus] = useState('')
  const [assignedToUserId, setAssignedToUserId] = useState('')
  const [priority, setPriority] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 50

  const params = { status, assignedToUserId, priority, page, limit }
  const { data, isLoading, error, refetch, isFetching } = usePutawayBoard(params)

  const tasks: PutawayTask[] = data?.tasks || []

  const groupedByStatus = tasks.reduce((acc, task) => {
    const s = task.status || 'unknown'
    if (!acc[s]) acc[s] = []
    acc[s].push(task)
    return acc
  }, {} as Record<string, PutawayTask[]>)

  const handleRefresh = () => {
    refetch()
    toast.info('Refreshing putaway board...')
  }

  const handleFilterReset = () => {
    setStatus('')
    setAssignedToUserId('')
    setPriority(0)
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Putaway Board</h1>
          <p className="text-muted-foreground">Real-time view of inbound putaway tasks</p>
        </div>
        <Button onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s || 'All'}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Assigned User ID</Label>
              <Input
                value={assignedToUserId}
                onChange={(e) => { setAssignedToUserId(e.target.value); setPage(1) }}
                placeholder="user-uuid or leave empty"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <select
                className="w-full rounded border px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => { setPriority(Number(e.target.value)); setPage(1) }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p === 0 ? 'Any' : p}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleFilterReset} className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Note: All filter fields are sent to the API. Empty strings may return all results depending on backend.
          </p>
        </CardContent>
      </Card>

      {/* Board / Table */}
      <Card>
        <CardHeader>
          <CardTitle>Putaway Tasks ({tasks.length})</CardTitle>
          <CardDescription>
            Grouped view + detailed table. Data from InboundWebController_getPutawayBoard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Simple Kanban-style grouping */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.keys(groupedByStatus).length === 0 && !isLoading && (
              <div className="col-span-full text-muted-foreground text-sm">No tasks match current filters.</div>
            )}
            {Object.entries(groupedByStatus).map(([st, list]) => (
              <div key={st} className="rounded border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary">{st}</Badge>
                  <span className="text-xs text-muted-foreground">{list.length}</span>
                </div>
                <div className="space-y-2 text-sm">
                  {list.slice(0, 5).map((t, idx) => (
                    <div key={t.id || idx} className="rounded bg-muted p-2 text-xs">
                      {t.productId ? `Product: ${t.productId}` : 'Task'}
                      {t.quantity != null && ` • Qty ${t.quantity}`}
                      {t.suggestedLocationId && <div className="text-[10px] text-muted-foreground">→ {t.suggestedLocationId}</div>}
                    </div>
                  ))}
                  {list.length > 5 && <div className="text-xs text-muted-foreground">+{list.length - 5} more</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : error ? (
            <div className="text-destructive">Failed to load putaway board.</div>
          ) : tasks.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No putaway tasks found for current filters.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Suggested Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, index) => (
                    <TableRow key={task.id || index}>
                      <TableCell className="font-mono text-xs">{task.id || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{task.status || '—'}</Badge></TableCell>
                      <TableCell>{task.priority ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{task.productId || '—'}</TableCell>
                      <TableCell>{task.quantity ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{task.suggestedLocationId || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{task.assignedToUserId || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Using real WMS API: <code>InboundWebController_getPutawayBoard</code> (wrapped in useQuery). 
        Adjust filters to query specific slices of the board.
      </div>
    </div>
  )
}

export default PutawayBoard
