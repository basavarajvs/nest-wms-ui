import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2, ArrowRightLeft, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  useCarrierRates,
  useCreateCarrierRate,
  useDeleteCarrierRate,
  useCompareCarrierRates,
  useGetCarrierQuote,
  type CarrierRate,
} from './data/carrier-rate-queries'
import type { CompareRatesDto, RateQuoteRequestDto } from '@/lib/types/wms-api'

const rateSchema = z.object({
  carrierId: z.string().min(1, 'Carrier ID is required'),
  serviceLevel: z.string().optional(),
  rate: z.coerce.number().optional(),
  currency: z.string().optional(),
  transitDays: z.coerce.number().optional(),
})

type RateForm = z.infer<typeof rateSchema>

export function CarrierRateShopping() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)

  const [compareOrigin, setCompareOrigin] = useState('')
  const [compareDest, setCompareDest] = useState('')
  const [compareWeight, setCompareWeight] = useState('')
  const [compareUomId, setCompareUomId] = useState('')
  const [comparePackageType, setComparePackageType] = useState('')
  const [compareParams, setCompareParams] = useState<any>(null)

  const [quoteOrigin, setQuoteOrigin] = useState('')
  const [quoteDest, setQuoteDest] = useState('')
  const [quoteWeight, setQuoteWeight] = useState('')
  const [quoteUom, setQuoteUom] = useState('')
  const [quoteResult, setQuoteResult] = useState<any>(null)

  const { data, isLoading, error, refetch } = useCarrierRates()
  const createMutation = useCreateCarrierRate()
  const deleteMutation = useDeleteCarrierRate()
  const { data: compareResults, isLoading: isComparing, error: compareError } = useCompareCarrierRates(compareParams)
  const quoteMutation = useGetCarrierQuote()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RateForm>({
    resolver: zodResolver(rateSchema) as any,
    defaultValues: {
      carrierId: '',
      serviceLevel: '',
      rate: undefined,
      currency: 'USD',
      transitDays: undefined,
    },
  })

  const rates = data?.rates ?? []
  const filtered = rates.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (r.carrierName || '').toLowerCase().includes(q) || (r.serviceLevel || '').toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginatedRates = filtered.slice((page - 1) * limit, page * limit)

  const onSubmit = async (values: RateForm) => {
    try {
      await createMutation.mutateAsync(values as any)
      toast.success('Carrier rate created')
      setDialogOpen(false)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Rate deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleCompare = () => {
    setCompareParams({
      originPostalCode: compareOrigin,
      destinationPostalCode: compareDest,
      weight: parseFloat(compareWeight),
      uomId: compareUomId,
      packageType: comparePackageType,
    })
  }

  const handleGetQuote = async () => {
    try {
      const res = await quoteMutation.mutateAsync({
        carrierId: quoteOrigin,
        destinationZone: quoteDest,
        weight: parseFloat(quoteWeight),
      })
      setQuoteResult(res)
      toast.success('Quote retrieved')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Quote failed')
    }
  }

  const minRate = compareResults && compareResults.length > 0
    ? Math.min(...compareResults.filter((r) => r.rate != null).map((r) => r.rate!))
    : null

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Carrier Rate Shopping</h1>
          <p className='text-muted-foreground'>Manage carrier rates and compare shipping costs</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={() => { setCompareOrigin(''); setCompareDest(''); setCompareWeight(''); setCompareUomId(''); setComparePackageType(''); setCompareParams(null); setCompareDialogOpen(true) }}>
            <ArrowRightLeft className='mr-2 h-4 w-4' /> Compare Rates
          </Button>
          <Button variant='outline' onClick={() => { setQuoteOrigin(''); setQuoteDest(''); setQuoteWeight(''); setQuoteUom(''); setQuoteResult(null); setQuoteDialogOpen(true) }}>
            <FileText className='mr-2 h-4 w-4' /> Get Quote
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { reset({ carrierId: '', serviceLevel: '', rate: undefined, currency: 'USD', transitDays: undefined }); setDialogOpen(true) }}>
                <Plus className='mr-2 h-4 w-4' /> New Rate
              </Button>
            </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Create Carrier Rate</DialogTitle>
                <DialogDescription>Add a new carrier rate for rate shopping.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='carrierId'>Carrier ID *</Label>
                  <Input id='carrierId' {...register('carrierId')} />
                  {errors.carrierId && <p className='text-sm text-destructive'>{errors.carrierId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='serviceLevel'>Service Level</Label>
                  <Input id='serviceLevel' {...register('serviceLevel')} placeholder='Ground, Express...' />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='rate'>Rate</Label>
                    <Input id='rate' type='number' step='0.01' {...register('rate')} />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='currency'>Currency</Label>
                    <Input id='currency' {...register('currency')} placeholder='USD' />
                  </div>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='transitDays'>Transit Days</Label>
                  <Input id='transitDays' type='number' {...register('transitDays')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending}>Create Rate</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search carriers...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carrier Rates</CardTitle>
          <CardDescription>{total} rates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load rates</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginatedRates.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No rates found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Service Level</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Transit Days</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className='font-medium'>{rate.carrierName || rate.id}</TableCell>
                      <TableCell>{rate.serviceLevel || '-'}</TableCell>
                      <TableCell>{rate.rate ? `$${rate.rate.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>{rate.currency || '-'}</TableCell>
                      <TableCell>{rate.transitDays ?? '-'}</TableCell>
                      <TableCell className='text-right'>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(rate.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className='mt-4 flex justify-between text-sm'>
                <span>Page {page} of {totalPages}</span>
                <div className='space-x-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rate?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={compareDialogOpen} onOpenChange={(open) => { setCompareDialogOpen(open); if (!open) setCompareParams(null) }}>
        <DialogContent className='sm:max-w-[640px]'>
          <DialogHeader>
            <DialogTitle>Compare Carrier Rates</DialogTitle>
            <DialogDescription>Enter shipment details to compare rates across all carriers.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='compareOrigin'>Origin Postal Code</Label>
                <Input id='compareOrigin' value={compareOrigin} onChange={(e) => setCompareOrigin(e.target.value)} placeholder='90210' />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='compareDest'>Destination Postal Code</Label>
                <Input id='compareDest' value={compareDest} onChange={(e) => setCompareDest(e.target.value)} placeholder='10001' />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='compareWeight'>Weight</Label>
                <Input id='compareWeight' type='number' step='0.1' value={compareWeight} onChange={(e) => setCompareWeight(e.target.value)} placeholder='10' />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='compareUomId'>UOM</Label>
                <Select value={compareUomId} onValueChange={setCompareUomId}>
                  <SelectTrigger id='compareUomId'>
                    <SelectValue placeholder='Select UOM' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='lbs'>Pounds (lbs)</SelectItem>
                    <SelectItem value='kg'>Kilograms (kg)</SelectItem>
                    <SelectItem value='oz'>Ounces (oz)</SelectItem>
                    <SelectItem value='g'>Grams (g)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='comparePackageType'>Package Type</Label>
              <Select value={comparePackageType} onValueChange={setComparePackageType}>
                <SelectTrigger id='comparePackageType'>
                  <SelectValue placeholder='Select package type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='box'>Box</SelectItem>
                  <SelectItem value='envelope'>Envelope</SelectItem>
                  <SelectItem value='pallet'>Pallet</SelectItem>
                  <SelectItem value='tube'>Tube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCompare} disabled={isComparing}>
              {isComparing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Compare
            </Button>
          </div>
          {compareParams && (
            <div className='border-t pt-4'>
              {isComparing ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : compareError ? (
                <p className='text-sm text-destructive'>{(compareError as any)?.message || 'Comparison failed'}</p>
              ) : compareResults && compareResults.length > 0 ? (
                <>
                  <h4 className='mb-2 text-sm font-medium'>Comparison Results</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Service Level</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Transit Days</TableHead>
                        <TableHead>Est. Delivery</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compareResults.map((rate: CarrierRate) => {
                        const isCheapest = rate.rate != null && rate.rate === minRate
                        return (
                          <TableRow key={rate.id || rate.carrierId} className={isCheapest ? 'bg-primary/5 font-medium' : ''}>
                            <TableCell>{rate.carrierName || rate.carrierId}</TableCell>
                            <TableCell>{rate.serviceLevel || '-'}</TableCell>
                            <TableCell>{rate.rate != null ? `$${rate.rate.toFixed(2)}` : '-'}</TableCell>
                            <TableCell>{rate.currency || '-'}</TableCell>
                            <TableCell>{rate.transitDays ?? '-'}</TableCell>
                            <TableCell>{'-'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {minRate != null && (
                    <p className='mt-2 text-xs text-muted-foreground'>* Cheapest option highlighted</p>
                  )}
                </>
              ) : (
                <p className='py-4 text-center text-sm text-muted-foreground'>No comparison results available.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Get Rate Quote</DialogTitle>
            <DialogDescription>Request a shipping rate quote from a carrier.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='quoteOrigin'>Origin (Carrier ID)</Label>
              <Input id='quoteOrigin' value={quoteOrigin} onChange={(e) => setQuoteOrigin(e.target.value)} placeholder='carrier-xyz' />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='quoteDest'>Destination Zone</Label>
              <Input id='quoteDest' value={quoteDest} onChange={(e) => setQuoteDest(e.target.value)} placeholder='Zone 1' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='quoteWeight'>Weight</Label>
                <Input id='quoteWeight' type='number' step='0.1' value={quoteWeight} onChange={(e) => setQuoteWeight(e.target.value)} placeholder='10' />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='quoteUom'>UOM</Label>
                <Select value={quoteUom} onValueChange={setQuoteUom}>
                  <SelectTrigger id='quoteUom'>
                    <SelectValue placeholder='Select UOM' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='lbs'>Pounds (lbs)</SelectItem>
                    <SelectItem value='kg'>Kilograms (kg)</SelectItem>
                    <SelectItem value='oz'>Ounces (oz)</SelectItem>
                    <SelectItem value='g'>Grams (g)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGetQuote} disabled={quoteMutation.isPending}>
              {quoteMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Get Quote
            </Button>
          </div>
          {quoteResult && (
            <div className='border-t pt-4'>
              <h4 className='mb-2 text-sm font-medium'>Quote Result</h4>
              <pre className='rounded-lg bg-muted p-3 text-xs'>{JSON.stringify(quoteResult, null, 2)}</pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
