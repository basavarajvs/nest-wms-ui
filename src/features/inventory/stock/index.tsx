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

import { useStockLevels, type StockLevel } from './data/stock-queries'

export function Stock() {
  const [facilityId, setFacilityId] = useState('')
  const [productId, setProductId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [lotId, setLotId] = useState('')
  const [productName, setProductName] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 50

  const params = {
    facilityId,
    productId,
    locationId,
    lotId,
    productName,
    lowStock: lowStockOnly,
    page,
    limit,
  }

  const { data, isLoading, error, refetch, isFetching } = useStockLevels(params)

  const levels: StockLevel[] = data?.levels || []

  const handleRefresh = () => {
    refetch()
    toast.info('Refreshing stock levels...')
  }

  const handleFilterReset = () => {
    setFacilityId('')
    setProductId('')
    setLocationId('')
    setLotId('')
    setProductName('')
    setLowStockOnly(false)
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Levels</h1>
          <p className="text-muted-foreground">Current inventory positions across facilities and locations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Facility ID</Label>
              <Input
                value={facilityId}
                onChange={(e) => { setFacilityId(e.target.value); setPage(1) }}
                placeholder="facility-uuid"
              />
            </div>
            <div>
              <Label>Product ID / SKU</Label>
              <Input
                value={productId}
                onChange={(e) => { setProductId(e.target.value); setPage(1) }}
                placeholder="product-uuid or SKU"
              />
            </div>
            <div>
              <Label>Location ID</Label>
              <Input
                value={locationId}
                onChange={(e) => { setLocationId(e.target.value); setPage(1) }}
                placeholder="location-uuid"
              />
            </div>
            <div>
              <Label>Lot / Batch</Label>
              <Input
                value={lotId}
                onChange={(e) => { setLotId(e.target.value); setPage(1) }}
                placeholder="lot-uuid"
              />
            </div>
            <div>
              <Label>Product Name</Label>
              <Input
                value={productName}
                onChange={(e) => { setProductName(e.target.value); setPage(1) }}
                placeholder="partial name"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lowStock"
                  checked={lowStockOnly}
                  onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1) }}
                />
                <Label htmlFor="lowStock">Low Stock Only</Label>
              </div>
              <Button variant="outline" size="sm" onClick={handleFilterReset}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Positions {data?.total ? `(${data.total})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-destructive">Failed to load stock: {(error as Error).message}</div>
          ) : levels.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No stock records match the current filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Location / Lot</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {levels.map((s, idx) => (
                    <TableRow key={s.id || idx}>
                      <TableCell>
                        <div className="font-medium">{s.productName || s.productSku || s.productId || '—'}</div>
                        <div className="text-xs text-muted-foreground">{s.productId}</div>
                      </TableCell>
                      <TableCell>
                        <div>{s.locationId || '—'}</div>
                        {s.lotId && <div className="text-xs text-muted-foreground">Lot: {s.lotId}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono">{s.onHand ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">{s.allocated ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">{s.reserved ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">{s.available ?? (s.onHand != null ? (s.onHand - (s.allocated || 0) - (s.reserved || 0)) : '—')}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'low' || (s.available != null && s.available < 0) ? 'destructive' : 'outline'}>
                          {s.status || '—'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>Page {page}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
