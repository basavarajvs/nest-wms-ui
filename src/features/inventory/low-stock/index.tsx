import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, AlertTriangle } from 'lucide-react'

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

import { useLowStockAlerts, type LowStockAlert } from './data/low-stock-queries'

export function LowStock() {
  const [facilityId, setFacilityId] = useState('')
  const [threshold, setThreshold] = useState(10)

  const params = { facilityId, threshold }

  const { data, isLoading, error, refetch, isFetching } = useLowStockAlerts(params)

  const alerts: LowStockAlert[] = data?.alerts || []

  const handleRefresh = () => {
    refetch()
    toast.info('Refreshing low stock alerts...')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-amber-500" /> Low Stock Alerts
          </h1>
          <p className="text-muted-foreground">Items below configured threshold</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Facility ID</Label>
              <Input value={facilityId} onChange={(e) => setFacilityId(e.target.value)} placeholder="facility-uuid" />
            </div>
            <div>
              <Label>Threshold</Label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value) || 10)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} disabled={isFetching}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : error ? (
            <div className="text-destructive">Failed to load alerts.</div>
          ) : alerts.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">No low stock items found for the current filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">On Hand</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((a, idx) => (
                  <TableRow key={a.id || idx}>
                    <TableCell>{a.productName || a.productSku || a.productId}</TableCell>
                    <TableCell>{a.locationId || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{a.onHand ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">{a.threshold ?? threshold}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Below Threshold</Badge>
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
