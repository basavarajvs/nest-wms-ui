import { useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useTransactions,
  type InventoryTransaction,
} from '@/features/inventory/transactions/data/transaction-queries'

export function TransactionList() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [typeFilter, setTypeFilter] = useState('')
  const [productSku, setProductSku] = useState('')

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } =
    useTransactions({
      page,
      limit,
      type: typeFilter || undefined,
      productSku: productSku || undefined,
      facilityId: selectedFacility?.id || undefined,
    })

  const transactions: InventoryTransaction[] = data?.transactions || []
  const total = data?.total ?? transactions.length

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Inventory Transactions
          </h1>
          <p className='text-muted-foreground'>
            Audit trail of stock movements and adjustments
          </p>
        </div>
        <Button
          variant='outline'
          onClick={() => {
            refetch()
            toast.info('Refreshing...')
          }}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='grid gap-2'>
              <Label>Transaction Type</Label>
              <Input
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                placeholder='e.g. RECEIVE, SHIP, ADJUST'
              />
            </div>
            <div className='grid gap-2'>
              <Label>Product SKU</Label>
              <Input
                value={productSku}
                onChange={(e) => {
                  setProductSku(e.target.value)
                  setPage(1)
                }}
                placeholder='SKU...'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Transactions {total ? `(${total})` : ''}</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='h-9 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium text-destructive'>
                  Failed to load transactions
                </p>
                <p className='text-sm text-muted-foreground'>
                  {(error as any)?.message || 'An unexpected error occurred'}
                </p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium'>Transaction History</p>
                <p className='max-w-lg text-sm text-muted-foreground'>
                  The inventory transactions endpoint is not currently exposed
                  by the WMS API. Transaction history can be viewed through the
                  audit log or database reporting tools.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'>Type</TableHead>
                      <TableHead className='w-[150px]'>Product</TableHead>
                      <TableHead className='w-[90px] text-right'>Qty</TableHead>
                      <TableHead className='w-[140px]'>Location</TableHead>
                      <TableHead className='w-[130px]'>Reference</TableHead>
                      <TableHead className='hidden w-[150px] md:table-cell'>
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <span className='font-mono text-xs'>
                            {t.type || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {t.productId
                            ? t.productId.substring(0, 12) + '...'
                            : '—'}
                        </TableCell>
                        <TableCell className='text-right font-mono'>
                          {t.quantity ?? '—'}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {t.locationId || '—'}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {t.reference || '—'}
                        </TableCell>
                        <TableCell className='hidden text-xs text-muted-foreground md:table-cell'>
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='flex items-center justify-between pt-4'>
                <p className='text-sm text-muted-foreground'>
                  Page {page} ({total} total)
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
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
