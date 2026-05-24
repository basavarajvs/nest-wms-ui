import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Search, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
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

import { useOrders, useCreateOrder, type Order } from './data/order-queries'

const orderSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  orderType: z.string().optional(),
  priority: z.number().optional(),
  requestedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
})

type OrderForm = z.infer<typeof orderSchema>

export function Orders() {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [clientCodeFilter, setClientCodeFilter] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const params = {
    page,
    limit,
    status: statusFilter,
    clientCode: clientCodeFilter,
    facilityId: facilityFilter,
  }

  const { data, isLoading, error, refetch, isFetching } = useOrders(params)
  const createMutation = useCreateOrder()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      clientCode: '',
      facilityId: '',
      orderType: 'standard',
      priority: 1,
      requestedDeliveryDate: '',
      notes: '',
    },
  })

  const orders: Order[] = data?.orders || []

  const onCreateSubmit = async (formData: OrderForm) => {
    try {
      await createMutation.mutateAsync({
        clientCode: formData.clientCode,
        facilityId: formData.facilityId,
        orderType: formData.orderType || undefined,
        priority: formData.priority,
        requestedDeliveryDate: formData.requestedDeliveryDate || undefined,
        notes: formData.notes || undefined,
      })
      toast.success('Sales Order created successfully')
      setDialogOpen(false)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create order')
    }
  }

  const handleRefresh = () => refetch()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">Manage outbound customer orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Sales Order</DialogTitle>
                <DialogDescription>Enter order details. Required fields marked with *.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientCode">Client Code *</Label>
                    <Input id="clientCode" {...register('clientCode')} placeholder="CLIENT-001" />
                    {errors.clientCode && <p className="text-sm text-destructive">{errors.clientCode.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="facilityId">Facility ID *</Label>
                    <Input id="facilityId" {...register('facilityId')} placeholder="facility-uuid" />
                    {errors.facilityId && <p className="text-sm text-destructive">{errors.facilityId.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderType">Order Type</Label>
                    <Input id="orderType" {...register('orderType')} defaultValue="standard" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input type="number" id="priority" {...register('priority', { valueAsNumber: true })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="requestedDeliveryDate">Requested Delivery Date</Label>
                  <Input type="date" id="requestedDeliveryDate" {...register('requestedDeliveryDate')} />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" {...register('notes')} rows={3} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Status</Label>
              <Input
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                placeholder="created,validated,released..."
              />
            </div>
            <div>
              <Label>Client Code</Label>
              <Input
                value={clientCodeFilter}
                onChange={(e) => { setClientCodeFilter(e.target.value); setPage(1) }}
                placeholder="CLIENT-001"
              />
            </div>
            <div>
              <Label>Facility ID</Label>
              <Input
                value={facilityFilter}
                onChange={(e) => { setFacilityFilter(e.target.value); setPage(1) }}
                placeholder="facility-uuid"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setStatusFilter(''); setClientCodeFilter(''); setFacilityFilter(''); setPage(1) }} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
          <CardDescription>Real data from OutboundWebController_listOrders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="text-destructive">Failed to load orders.</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found for current filters.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Facility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, idx) => (
                    <TableRow key={order.id || idx}>
                      <TableCell className="font-mono text-sm">{order.orderNumber || order.id || '—'}</TableCell>
                      <TableCell>{order.clientCode || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{order.status || '—'}</Badge></TableCell>
                      <TableCell>{order.priority ?? '—'}</TableCell>
                      <TableCell>{order.requestedDeliveryDate ? new Date(order.requestedDeliveryDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{order.facilityId || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Orders
