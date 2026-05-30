import { useState } from 'react'
import { RefreshCw, Search, Send, Plus } from 'lucide-react'
import { toast } from 'sonner'
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
import { useTransfers, useDispatchTransfer, type Transfer } from '@/features/transfers/data/transfer-queries'
import { useFacility } from '@/hooks/useFacility'

const TRANSFER_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'INTERNAL', label: 'Internal' },
  { value: 'INTER_FACILITY', label: 'Inter-Facility' },
  { value: 'RETURN', label: 'Return' },
  { value: 'CUSTOMER', label: 'Customer' },
]

const TRANSFER_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'CREATED', label: 'Created' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const STATUS_STYLES: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  DISPATCHED: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  IN_TRANSIT: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  RECEIVED: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

interface TransferListProps {
  onCreateClick?: () => void
}

export function TransferList({ onCreateClick }: TransferListProps) {
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { selectedFacility } = useFacility()

  const { data, isLoading, isError, error, refetch, isFetching } = useTransfers({
    page,
    limit,
    status: statusFilter,
    transferType: typeFilter,
    facilityId: selectedFacility?.id,
  })

  const dispatchMutation = useDispatchTransfer()

  const transfers: Transfer[] = data?.transfers || []
  const total = data?.total ?? transfers.length
  const totalPages = Math.ceil(total / limit)

  const handleFilterReset = () => {
    setStatusFilter('')
    setTypeFilter('')
    setSearchTerm('')
    setPage(1)
  }

  const handleDispatch = async (id: string) => {
    try {
      await dispatchMutation.mutateAsync(id)
      toast.success('Transfer dispatched successfully')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to dispatch transfer')
    }
  }

  const filtered = transfers.filter((t) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (t.transferNumber || '').toLowerCase().includes(term) ||
      (t.id || '').toLowerCase().includes(term) ||
      (t.fromLocationId || '').toLowerCase().includes(term) ||
      (t.toLocationId || '').toLowerCase().includes(term)
    )
  })

  const canDispatch = (t: Transfer) =>
    t.id && t.status !== 'DISPATCHED' && t.status !== 'IN_TRANSIT' && t.status !== 'RECEIVED' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfers</h1>
          <p className="text-muted-foreground">
            Intra and inter-facility inventory movements
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
              New Transfer
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
                  {TRANSFER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(v) => { setTypeFilter(v); setPage(1) }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_TYPE_OPTIONS.map((opt) => (
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
                placeholder="Number, ID, or location..."
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
          <CardTitle>Transfers ({total})</CardTitle>
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
              <p className="text-destructive font-medium">Failed to load transfers</p>
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
                <svg className="h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <p className="text-muted-foreground font-medium">No transfers found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter || typeFilter || searchTerm
                  ? 'No transfers match the current filters. Try clearing filters.'
                  : 'Create your first transfer to move inventory between locations.'}
              </p>
              {(statusFilter || typeFilter || searchTerm) && (
                <Button variant="outline" size="sm" onClick={handleFilterReset}>
                  Clear Filters
                </Button>
              )}
              {!statusFilter && !typeFilter && !searchTerm && onCreateClick && (
                <Button size="sm" onClick={onCreateClick}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Transfer
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transfer #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">From</TableHead>
                      <TableHead className="hidden md:table-cell">To</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {t.transferNumber || t.id.substring(0, 12) + '...' || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.transferType || '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${STATUS_STYLES[t.status || ''] || ''} capitalize`}
                          >
                            {t.status ? t.status.replace(/_/g, ' ') : '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {t.fromLocationId || t.fromFacilityId || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {t.toLocationId || t.toFacilityId || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canDispatch(t) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDispatch(t.id!)}
                                disabled={dispatchMutation.isPending}
                              >
                                <Send className="mr-1 h-3 w-3" />
                                Dispatch
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total transfers)
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
