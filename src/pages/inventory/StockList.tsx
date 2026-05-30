import { useState } from 'react'
import { RefreshCw, Filter } from 'lucide-react'
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
import { useStockLevels, type StockLevel } from '@/features/inventory/stock/data/stock-queries'
import { useFacility } from '@/hooks/useFacility'

export function StockList() {
  const [productId, setProductId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [lotId, setLotId] = useState('')
  const [productName, setProductName] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 50

  const { selectedFacility } = useFacility()

  const params = {
    facilityId: selectedFacility?.id || '',
    productId,
    locationId,
    lotId,
    productName,
    lowStock: lowStockOnly,
    page,
    limit,
  }

  const { data, isLoading, isError, error, refetch, isFetching } = useStockLevels(params)

  const levels: StockLevel[] = data?.levels || []
  const total = data?.total ?? levels.length

  const handleFilterReset = () => {
    setProductId('')
    setLocationId('')
    setLotId('')
    setProductName('')
    setLowStockOnly(false)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Levels</h1>
          <p className="text-muted-foreground">
            Current inventory positions across facilities and locations
          </p>
        </div>
        <Button variant="outline" onClick={() => { refetch(); toast.info('Refreshing stock levels...') }} disabled={isFetching}>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <div className="grid gap-2">
              <Label>Product ID / SKU</Label>
              <Input value={productId} onChange={(e) => { setProductId(e.target.value); setPage(1) }} placeholder="product-uuid or SKU" />
            </div>
            <div className="grid gap-2">
              <Label>Location ID</Label>
              <Input value={locationId} onChange={(e) => { setLocationId(e.target.value); setPage(1) }} placeholder="location-uuid" />
            </div>
            <div className="grid gap-2">
              <Label>Lot / Batch</Label>
              <Input value={lotId} onChange={(e) => { setLotId(e.target.value); setPage(1) }} placeholder="lot-uuid" />
            </div>
            <div className="grid gap-2">
              <Label>Product Name</Label>
              <Input value={productName} onChange={(e) => { setProductName(e.target.value); setPage(1) }} placeholder="partial name" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2 pb-1">
                <input type="checkbox" id="lowStock" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1) }} className="h-4 w-4" />
                <Label htmlFor="lowStock" className="text-sm cursor-pointer">Low Stock Only</Label>
              </div>
              <Button variant="outline" size="sm" onClick={handleFilterReset}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Stock Positions {total ? `(${total})` : ''}
          </CardTitle>
          <CardDescription>
            {selectedFacility ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}` : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load stock levels</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : levels.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">No stock records match the current filters</p>
              {(productId || locationId || lotId || productName || lowStockOnly) && (
                <Button variant="outline" size="sm" onClick={handleFilterReset}>Clear Filters</Button>
              )}
            </div>
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
                  {levels.map((s) => (
                    <TableRow key={s.id}>
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
                      <TableCell className="text-right font-mono">
                        {s.available ?? (s.onHand != null ? s.onHand - (s.allocated || 0) - (s.reserved || 0) : '—')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(s.status === 'low' || (s.available != null && s.available < 0)) ? 'destructive' : 'outline'}>
                          {s.status || (s.available != null && s.available <= 0 ? 'out of stock' : 'in stock')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>Page {page} ({total} total)</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
