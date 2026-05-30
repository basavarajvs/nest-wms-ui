import { useState } from 'react'
import { RefreshCw, Search, ClipboardCheck, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { useCycleCounts, type CycleCount } from '@/features/cycle-counts/data/cycle-count-queries'
import { useFacility } from '@/hooks/useFacility'

const SCOPE_TYPE_OPTIONS = [
  { value: '', label: 'All Scopes' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'ZONE', label: 'Zone' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'ABC', label: 'ABC Class' },
]

const COUNT_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ADJUSTED', label: 'Adjusted' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  ADJUSTED: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

interface CountListProps {
  onCreateClick?: () => void
}

export function CountList({ onCreateClick }: CountListProps) {
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = useCycleCounts({
    page,
    limit,
    status: statusFilter,
    scopeType: scopeFilter,
    facilityId: selectedFacility?.id,
  })

  const counts: CycleCount[] = data?.counts || []
  const total = data?.total ?? counts.length
  const totalPages = Math.ceil(total / limit)

  const handleFilterReset = () => {
    setStatusFilter('')
    setScopeFilter('')
    setSearchTerm('')
    setPage(1)
  }

  const filtered = counts.filter((c) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (c.countNumber || '').toLowerCase().includes(term) ||
      (c.id || '').toLowerCase().includes(term) ||
      (c.scopeIdentifier || '').toLowerCase().includes(term)
    )
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardCheck className="h-6 w-6" />
            Cycle Counts
          </h1>
          <p className="text-muted-foreground">
            Schedule and monitor inventory counting operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Count
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {COUNT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Scope</Label>
              <Select
                value={scopeFilter}
                onValueChange={(v) => { setScopeFilter(v); setPage(1) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Scopes" />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Search</Label>
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                placeholder="Count number, ID, or scope..."
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleFilterReset}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Cycle Counts ({total})</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load cycle counts</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No cycle counts found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter || scopeFilter || searchTerm
                  ? 'No counts match the current filters. Try clearing filters.'
                  : 'Schedule your first cycle count to maintain inventory accuracy.'}
              </p>
              {(statusFilter || scopeFilter || searchTerm) && (
                <Button variant="outline" size="sm" onClick={handleFilterReset}>
                  Clear Filters
                </Button>
              )}
              {!statusFilter && !scopeFilter && !searchTerm && onCreateClick && (
                <Button size="sm" onClick={onCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Count
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Count #</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Scope</TableHead>
                      <TableHead className="hidden md:table-cell">Progress</TableHead>
                      <TableHead className="hidden md:table-cell">Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {c.countNumber || c.id.substring(0, 12) + '...' || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.countMethod || '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${STATUS_STYLES[c.status || ''] || ''} capitalize`}
                          >
                            {c.status ? c.status.replace(/_/g, ' ') : '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {c.scopeType || '—'}
                          {c.scopeIdentifier ? ` (${c.scopeIdentifier})` : ''}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {c.totalItems != null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${c.totalItems > 0 ? Math.min(100, ((c.countedItems || 0) / c.totalItems) * 100) : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {c.countedItems || 0}/{c.totalItems}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {c.scheduledAt
                            ? new Date(c.scheduledAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total counts)
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
    </>
  )
}
