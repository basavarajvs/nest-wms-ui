import { useNavigate } from '@tanstack/react-router'
import { Package, ClipboardList, Truck, Warehouse, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'

const OUTBOUND_LINKS = [
  {
    title: 'Sales Orders',
    description: 'Create and manage outbound customer orders. Allocate inventory and release to waves.',
    icon: Package,
    href: '/outbound/orders',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    title: 'Allocations',
    description: 'View and override pending inventory allocations for outbound orders.',
    icon: ClipboardList,
    href: '/outbound/allocations',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
  },
  {
    title: 'Picking Waves',
    description: 'Wave planning and picking board. Create waves and track pick task progress.',
    icon: Warehouse,
    href: '/outbound/waves',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
  },
  {
    title: 'Shipments',
    description: 'Manage outbound shipments and generate carrier manifests.',
    icon: Truck,
    href: '/outbound/shipments',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
  },
]

export default function OutboundPage() {
  const navigate = useNavigate()

  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Outbound Operations</h1>
            <p className="text-muted-foreground">
              Manage the complete outbound fulfillment flow — from order creation through allocation, picking, and shipment
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {OUTBOUND_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Card
                  key={link.href}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => navigate({ to: link.href as '/outbound/orders' | '/outbound/allocations' | '/outbound/waves' | '/outbound/shipments' })}
                >
                  <CardHeader>
                    <div className={`mb-2 inline-flex rounded-lg p-3 ${link.bgColor}`}>
                      <Icon className={`h-6 w-6 ${link.color}`} />
                    </div>
                    <CardTitle className="text-lg">{link.title}</CardTitle>
                    <CardDescription>
                      {link.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="gap-2 p-0 h-auto text-sm font-medium">
                      Open {link.title}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Outbound Process Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</div>
                  <p className="mt-1 text-sm font-medium">Order Entry</p>
                  <p className="text-xs text-muted-foreground mt-1">Create and validate customer sales orders</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">2</div>
                  <p className="mt-1 text-sm font-medium">Allocation</p>
                  <p className="text-xs text-muted-foreground mt-1">Reserve inventory against orders</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</div>
                  <p className="mt-1 text-sm font-medium">Picking</p>
                  <p className="text-xs text-muted-foreground mt-1">Group orders into waves for efficient picking</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">4</div>
                  <p className="mt-1 text-sm font-medium">Shipment</p>
                  <p className="text-xs text-muted-foreground mt-1">Pack, manifest, and dispatch shipments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
