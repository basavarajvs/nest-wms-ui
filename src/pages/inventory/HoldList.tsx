import { useState } from 'react'
import { RefreshCw, Filter, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useHolds, type Hold } from '@/features/inventory/holds/data/hold-queries'
import { useFacility } from '@/hooks/useFacility'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'released', label: 'Released' },
  { value: 'expired', label: 'Expired' },
]

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'destructive',
  released: 'outline',
  expired: 'secondary',
}

const HOLD_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'quality', label: 'Quality' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'customer', label: 'Customer' },
  { value: 'other', label: 'Other' },
]

export function HoldList() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [locationId, setLocationId] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useHolds({
    page,
    limit,
    status: statusFilter,
    holdType: typeFilter,
    locationId: locationId || undefined,
  })
  const { selectedFacility } = useFacility()

  const holds: Hold[] = data?.holds || []
  const total = data?.total ?? holds.length
  const totalPages = Math.ceil(total / limit)

  const handleFilterReset = () => {
    setStatusFilter('')
    setTypeFilter('')
    setLocationId('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Holds</h1>
          <p className="text-muted-foreground">
            View and manage stock that has been placed on hold
          </p>
        </div>
        <Button variant="outline" onClick={() => { refetch(); toast.info('Refreshing holds...') }} disabled={isFetching}>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Hold Type</Label>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {HOLD_TYPE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <input
                value={locationId}
                onChange={(e) => { setLocationId(e.target.value); setPage(1) }}
                placeholder="location-id"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleFilterReset} className="w-full">Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Holds {total ? `(${total})` : ''}</CardTitle>
          <CardDescription>
            {selectedFacility ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}` : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load holds</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : holds.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Ban className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No holds found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter || typeFilter || locationId
                  ? 'No holds match the current filters.'
                  : 'No stock is currently on hold matching the filters.'}
              </p>
              {(statusFilter || typeFilter || locationId) && (
                <Button variant="outline" size="sm" onClick={handleFilterReset}>Clear Filters</Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden md:table-cell">SKU</TableHead>
                      <TableHead>Hold Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="hidden lg:table-cell">Released</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holds.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>
                          <div className="font-medium">{h.productName || h.productId || '—'}</div>
                          <div className="text-xs text-muted-foreground">{h.locationId || ''}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{h.productSku || '—'}</TableCell>
                        <TableCell className="capitalize">{h.holdType || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{h.reason || '—'}</TableCell>
                        <TableCell className="text-right font-mono">{h.quantity ?? h.qty ?? '—'}</TableCell>
                        <TableCell><Badge variant={STATUS_BADGE[h.status || 'active'] || 'secondary'}>{h.status || 'active'}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {h.releasedAt ? new Date(h.releasedAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {h.status === 'active' && (
                            <Button size="sm" variant="outline" disabled title="Release hold endpoint not available in current API">
                              Release
                            </Button>
                          )}
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
    </div>
  )
}
