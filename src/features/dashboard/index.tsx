import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Package, ArrowDownToLine, ArrowUpFromLine, ClipboardList, AlertTriangle, Activity } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'

import {
  useOpenOrdersCount,
  usePendingAllocationsCount,
  usePendingPutawaysCount,
  usePendingPicksCount,
  useLowStockCount,
  useRecentOrders,
  useRecentAdjustments,
  type RecentOrder,
  type RecentAdjustment,
} from './data/dashboard-queries'

interface KpiCardProps {
  title: string
  value: number | undefined
  isLoading: boolean
  error?: unknown
  icon: React.ReactNode
  description?: string
}

function KpiCard({ title, value, isLoading, error, icon, description }: KpiCardProps) {
  const displayValue = isLoading ? '—' : error ? '!' : (value ?? 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : error != null ? (
          <div className="text-2xl font-bold text-destructive">—</div>
        ) : (
          <div className="text-2xl font-bold">{displayValue}</div>
        )}
        {description && !isLoading && error == null && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error != null && (
          <p className="text-xs text-destructive">Failed to load</p>
        )}
      </CardContent>
    </Card>
  )
}

function RecentOrdersList({ orders, isLoading, error }: { orders: RecentOrder[]; isLoading: boolean; error?: unknown }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }
  if (error != null) {
    return <p className="text-sm text-destructive">Unable to load recent orders.</p>
  }
  if (!orders.length) {
    return <p className="text-sm text-muted-foreground">No recent orders.</p>
  }
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">{order.orderNumber}</div>
            <div className="text-xs text-muted-foreground">{order.status}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentAdjustmentsList({ adjustments, isLoading, error }: { adjustments: RecentAdjustment[]; isLoading: boolean; error?: unknown }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }
  if (error != null) {
    return <p className="text-sm text-destructive">Unable to load recent adjustments.</p>
  }
  if (!adjustments.length) {
    return <p className="text-sm text-muted-foreground">No recent adjustments.</p>
  }
  return (
    <div className="space-y-4">
      {adjustments.map((adj) => (
        <div key={adj.id} className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">{adj.reference}</div>
            <div className="text-xs text-muted-foreground">{adj.reason}</div>
          </div>
          <div className="text-xs text-muted-foreground">
            {adj.createdAt ? new Date(adj.createdAt).toLocaleDateString() : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const queryClient = useQueryClient()

  const openOrders = useOpenOrdersCount()
  const pendingAllocs = usePendingAllocationsCount()
  const pendingPutaways = usePendingPutawaysCount()
  const pendingPicks = usePendingPicksCount()
  const lowStock = useLowStockCount()
  const recentOrdersQ = useRecentOrders()
  const recentAdjsQ = useRecentAdjustments()

  const isAnyLoading =
    openOrders.isLoading ||
    pendingAllocs.isLoading ||
    pendingPutaways.isLoading ||
    pendingPicks.isLoading ||
    lowStock.isLoading ||
    recentOrdersQ.isLoading ||
    recentAdjsQ.isLoading

  const hasAnyError =
    openOrders.error ||
    pendingAllocs.error ||
    pendingPutaways.error ||
    pendingPicks.error ||
    lowStock.error ||
    recentOrdersQ.error ||
    recentAdjsQ.error

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['wms', 'dashboard'] })
    toast.success('Dashboard data refreshed')
  }

  // Show a toast on first error (avoid spamming)
  // In a real app we could use useEffect + ref, but for simplicity we let cards show inline errors.

  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Warehouse Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time overview of inbound, outbound, and inventory operations
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={isAnyLoading} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isAnyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* KPI Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Open Orders"
            value={openOrders.data}
            isLoading={openOrders.isLoading}
            error={openOrders.error}
            icon={<Package className="h-4 w-4" />}
            description="Created, validated, released"
          />
          <KpiCard
            title="Pending Allocations"
            value={pendingAllocs.data}
            isLoading={pendingAllocs.isLoading}
            error={pendingAllocs.error}
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            description="Orders awaiting allocation"
          />
          <KpiCard
            title="Pending Putaways"
            value={pendingPutaways.data}
            isLoading={pendingPutaways.isLoading}
            error={pendingPutaways.error}
            icon={<ArrowDownToLine className="h-4 w-4" />}
            description="Goods awaiting putaway"
          />
          <KpiCard
            title="Pending Picks"
            value={pendingPicks.data}
            isLoading={pendingPicks.isLoading}
            error={pendingPicks.error}
            icon={<ClipboardList className="h-4 w-4" />}
            description="Active picking waves / tasks"
          />
          <KpiCard
            title="Low Stock Items"
            value={lowStock.data}
            isLoading={lowStock.isLoading}
            error={lowStock.error}
            icon={<AlertTriangle className="h-4 w-4" />}
            description="Below reorder threshold"
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isAnyLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : hasAnyError ? (
                <div>
                  <div className="text-2xl font-bold text-amber-600">Degraded</div>
                  <p className="text-xs text-muted-foreground">Some metrics failed to load</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-green-600">Healthy</div>
                  <p className="text-xs text-muted-foreground">All sources responding</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest 5 outbound orders</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentOrdersList
                orders={recentOrdersQ.data ?? []}
                isLoading={recentOrdersQ.isLoading}
                error={recentOrdersQ.error}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Adjustments</CardTitle>
              <CardDescription>Latest 5 inventory adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAdjustmentsList
                adjustments={recentAdjsQ.data ?? []}
                isLoading={recentAdjsQ.isLoading}
                error={recentAdjsQ.error}
              />
            </CardContent>
          </Card>
        </div>

        {hasAnyError && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Some data could not be retrieved. Ensure you are logged in with a valid tenant and that the WMS backend is reachable.
          </div>
        )}
      </Main>
    </>
  )
}
