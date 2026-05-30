import { useState } from 'react'
import { RefreshCw, Filter, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useLowStockAlerts, type LowStockAlert } from '@/features/inventory/low-stock/data/low-stock-queries'
import { useFacility } from '@/hooks/useFacility'

export function LowStockList() {
  const [productSku, setProductSku] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = useLowStockAlerts({
    facilityId: selectedFacility?.id || '',
    productSku: productSku || undefined,
    page,
    limit,
  })

  const alerts: LowStockAlert[] = data?.alerts || []
  const total = data?.total ?? alerts.length

  const handleFilterReset = () => {
    setProductSku('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Low Stock Alerts</h1>
          <p className="text-muted-foreground">
            Products below configured thresholds that need attention
          </p>
        </div>
        <Button variant="outline" onClick={() => { refetch(); toast.info('Refreshing alerts...') }} disabled={isFetching}>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label>Product SKU</Label>
              <Input value={productSku} onChange={(e) => { setProductSku(e.target.value); setPage(1) }} placeholder="Filter by SKU..." />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleFilterReset}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Alerts {total ? `(${total})` : ''}</CardTitle>
          <CardDescription>
            {selectedFacility ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}` : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load alerts</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No low stock alerts</p>
              <p className="text-sm text-muted-foreground max-w-md">All products are above their configured thresholds. Alerts will appear here when stock levels fall below reorder points.</p>
              {productSku && <Button variant="outline" size="sm" onClick={handleFilterReset}>Clear Filters</Button>}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">On Hand</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.productName || a.productSku || a.productId || '—'}</div>
                          <div className="text-xs text-muted-foreground">{a.productSku}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.locationId || '—'}</TableCell>
                        <TableCell className="text-right font-mono">{a.onHand ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono">{a.available ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono">{a.threshold ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Low Stock</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Page {page} ({total} total)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
