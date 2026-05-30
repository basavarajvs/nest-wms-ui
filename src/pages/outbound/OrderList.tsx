import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, RefreshCw } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea'
import { useOrders, useCreateOrder, type Order } from '@/features/outbound/orders/data/order-queries'
import { useFacility } from '@/hooks/useFacility'

const orderSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required'),
  orderType: z.string().optional(),
  priority: z.coerce.number().optional(),
  requestedDeliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
})

type OrderForm = z.infer<typeof orderSchema>

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'created', label: 'Created' },
  { value: 'validated', label: 'Validated' },
  { value: 'allocated', label: 'Allocated' },
  { value: 'released', label: 'Released' },
  { value: 'picked', label: 'Picked' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_STYLES: Record<string, string> = {
  created: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
  validated: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  allocated: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400',
  released: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
  picked: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400',
  shipped: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Lowest' },
  { value: '2', label: '2 - Low' },
  { value: '3', label: '3 - Normal' },
  { value: '4', label: '4 - High' },
  { value: '5', label: '5 - Critical' },
]

export function OrderList() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [statusFilter, setStatusFilter] = useState('')
  const [clientCodeFilter, setClientCodeFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useOrders({
    page,
    limit,
    status: statusFilter,
    clientCode: clientCodeFilter,
  })
  const createMutation = useCreateOrder()
  const { selectedFacility } = useFacility()

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientCode: '',
      orderType: 'standard',
      priority: 3,
      requestedDeliveryDate: '',
      deliveryAddress: '',
      notes: '',
    },
  })

  const orders: Order[] = data?.orders || []
  const total = data?.total ?? orders.length
  const totalPages = Math.ceil(total / limit)

  const onCreateSubmit = async (formData: OrderForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
        clientCode: formData.clientCode,
        orderType: formData.orderType || undefined,
        priority: formData.priority,
        requestedDeliveryDate: formData.requestedDeliveryDate || undefined,
        notes: formData.notes || undefined,
      })
      toast.success('Sales Order created successfully')
      setDialogOpen(false)
      form.reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create order')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">
            Manage outbound customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
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
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Client Code</Label>
              <Input
                value={clientCodeFilter}
                onChange={(e) => { setClientCodeFilter(e.target.value); setPage(1) }}
                placeholder="e.g. CLIENT-001"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => { setStatusFilter(''); setClientCodeFilter(''); setPage(1) }}
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
          <CardTitle>Orders ({total})</CardTitle>
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
              <p className="text-destructive font-medium">Failed to load orders</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <svg className="h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                  <polyline points="9 3 15 3 21 9 21 15" />
                  <path d="M16 21v-4a2 2 0 0 1 2-2h2" />
                  <path d="M21 15v4a2 2 0 0 1-2 2h-2" />
                </svg>
              </div>
              <p className="text-muted-foreground font-medium">No orders found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {statusFilter || clientCodeFilter
                  ? 'No orders match the current filters. Try clearing filters.'
                  : 'Create your first sales order to get started.'}
              </p>
              {(statusFilter || clientCodeFilter) && (
                <Button variant="outline" size="sm" onClick={() => { setStatusFilter(''); setClientCodeFilter(''); setPage(1) }}>
                  Clear Filters
                </Button>
              )}
              {!statusFilter && !clientCodeFilter && (
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="hidden md:table-cell">Requested Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {order.orderNumber || order.id.substring(0, 12) + '...'}
                        </TableCell>
                        <TableCell>{order.clientCode || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground capitalize">
                          {order.orderType || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${STATUS_STYLES[order.status || ''] || ''} capitalize`}
                          >
                            {order.status || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.priority != null ? (
                            <Badge variant={order.priority >= 5 ? 'destructive' : order.priority >= 3 ? 'default' : 'secondary'}>
                              {order.priority}
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {order.requestedDeliveryDate
                            ? new Date(order.requestedDeliveryDate).toLocaleDateString()
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <form onSubmit={form.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New Sales Order</DialogTitle>
              <DialogDescription>
                Enter order details. Inventory will be allocated upon creation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedFacility && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="clientCode">Client Code *</Label>
                <Input id="clientCode" {...form.register('clientCode')} placeholder="e.g. CLIENT-001" />
                {form.formState.errors.clientCode && (
                  <p className="text-sm text-destructive">{form.formState.errors.clientCode.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="orderType">Order Type</Label>
                  <Input id="orderType" {...form.register('orderType')} placeholder="standard" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={String(form.watch('priority') ?? 3)}
                    onValueChange={(v) => form.setValue('priority', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="requestedDeliveryDate">Requested Delivery Date</Label>
                <Input id="requestedDeliveryDate" type="date" {...form.register('requestedDeliveryDate')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <Textarea id="deliveryAddress" {...form.register('deliveryAddress')} rows={2} placeholder="Street, city, postal code..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register('notes')} rows={2} placeholder="Additional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
