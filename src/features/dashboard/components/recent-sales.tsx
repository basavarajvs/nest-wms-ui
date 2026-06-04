import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useRecentOrders,
  useRecentAdjustments,
  useLowStockCount,
  type RecentOrder,
  type RecentAdjustment,
} from '../data/dashboard-queries'

function OrderItem({ order }: { order: RecentOrder }) {
  const statusVariant =
    order.status === 'SHIPPED' || order.status === 'COMPLETED'
      ? 'default'
      : order.status === 'CANCELLED'
        ? 'destructive'
        : 'secondary'

  return (
    <div className='flex items-center justify-between text-sm'>
      <div className='min-w-0 flex-1'>
        <div className='truncate font-medium'>{order.orderNumber}</div>
        <div className='text-xs text-muted-foreground'>
          {order.createdAt
            ? new Date(order.createdAt).toLocaleDateString()
            : ''}
        </div>
      </div>
      <Badge variant={statusVariant} className='ml-2 shrink-0'>
        {order.status}
      </Badge>
    </div>
  )
}

function AdjustmentItem({ adjustment }: { adjustment: RecentAdjustment }) {
  return (
    <div className='flex items-center justify-between text-sm'>
      <div className='min-w-0 flex-1'>
        <div className='truncate font-medium'>{adjustment.reference}</div>
        <div className='text-xs text-muted-foreground'>
          {adjustment.reason}
        </div>
      </div>
      <div className='shrink-0 text-xs text-muted-foreground'>
        {adjustment.createdAt
          ? new Date(adjustment.createdAt).toLocaleDateString()
          : ''}
      </div>
    </div>
  )
}

export function RecentSales() {
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useRecentOrders()
  const { data: adjustments, isLoading: adjsLoading, error: adjsError } = useRecentAdjustments()
  const { data: lowStockCount, isLoading: lowStockLoading } = useLowStockCount()

  const isLoading = ordersLoading || adjsLoading || lowStockLoading

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-8 w-full' />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h4 className='mb-3 text-sm font-medium'>Recent Orders</h4>
        {ordersError ? (
          <p className='text-sm text-destructive'>Failed to load orders</p>
        ) : !orders?.length ? (
          <p className='text-sm text-muted-foreground'>No recent orders</p>
        ) : (
          <div className='space-y-3'>
            {orders.slice(0, 3).map((order) => (
              <OrderItem key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className='mb-3 text-sm font-medium'>Recent Adjustments</h4>
        {adjsError ? (
          <p className='text-sm text-destructive'>Failed to load adjustments</p>
        ) : !adjustments?.length ? (
          <p className='text-sm text-muted-foreground'>No recent adjustments</p>
        ) : (
          <div className='space-y-3'>
            {adjustments.slice(0, 3).map((adj) => (
              <AdjustmentItem key={adj.id} adjustment={adj} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className='mb-3 text-sm font-medium'>Low Stock Alerts</h4>
        {lowStockLoading ? (
          <Skeleton className='h-8 w-full' />
        ) : (lowStockCount ?? 0) > 0 ? (
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-amber-600 font-medium'>{lowStockCount}</span>
            <span className='text-muted-foreground'>
              {lowStockCount === 1 ? 'item is' : 'items are'} below reorder
              threshold
            </span>
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>
            All stock levels are healthy
          </p>
        )}
      </div>
    </div>
  )
}
