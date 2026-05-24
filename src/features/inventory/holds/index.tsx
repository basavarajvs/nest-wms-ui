import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

import { useHolds, type Hold } from './data/hold-queries'

const STATUS_OPTIONS = ['', 'active', 'released', 'expired']

export function Holds() {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')

  const params = { page, limit, status: statusFilter, facilityId: facilityFilter }

  const { data, isLoading, error, refetch, isFetching } = useHolds(params)

  const holds: Hold[] = data?.holds || []

  const handleRefresh = () => {
    refetch()
    toast.info('Refreshing holds...')
  }

  // Note: No releaseHold or updateHold endpoint is currently exposed in the WMS Web API controller.
  // A "Release" action would require additional backend support.

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Holds</h1>
          <p className="text-muted-foreground">View and manage stock that has been placed on hold</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" /> Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Status</Label>
              <select
                className="w-40 rounded border px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
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
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Holds {data?.total ? `(${data.total})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : error ? (
            <div className="text-destructive">Failed to load holds.</div>
          ) : holds.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">No holds match the current filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Product / Location</TableHead>
                  <TableHead className="text-right">Qty on Hold</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holds.map((h, idx) => (
                  <TableRow key={h.id || idx}>
                    <TableCell className="font-mono text-xs">{h.id}</TableCell>
                    <TableCell>
                      {h.productId}<br />
                      <span className="text-xs text-muted-foreground">{h.locationId || '—'}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{h.quantity ?? '—'}</TableCell>
                    <TableCell>{h.reason || '—'}</TableCell>
                    <TableCell><Badge>{h.status || 'active'}</Badge></TableCell>
                    <TableCell className="text-xs">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled title="Release hold requires additional backend endpoint not currently exposed in Web API">
                        Release
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Note: Full hold release and update actions are not yet available via the current WMS Web API surface (only listing is exposed).
      </div>
    </div>
  )
}
