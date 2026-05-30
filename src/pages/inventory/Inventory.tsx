import { useNavigate } from '@tanstack/react-router'
import { PackageSearch, RefreshCw, Ban, ShieldCheck, History, AlertTriangle, ArrowRight } from 'lucide-react'
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

const INVENTORY_LINKS = [
  {
    title: 'Stock Levels',
    description: 'Current inventory positions across facilities, locations, and lots.',
    icon: PackageSearch,
    href: '/inventory/stock',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    title: 'Low Stock Alerts',
    description: 'Items below configured thresholds that need replenishment attention.',
    icon: AlertTriangle,
    href: '/inventory/low-stock',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
  },
  {
    title: 'Adjustments',
    description: 'Create, submit, and approve stock corrections and cycle count adjustments.',
    icon: RefreshCw,
    href: '/inventory/adjustments',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    title: 'Holds',
    description: 'View and manage stock that has been placed on hold for quality or compliance.',
    icon: Ban,
    href: '/inventory/holds',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
  },
  {
    title: 'Policies',
    description: 'Set reorder points, safety stock levels, and inventory rules.',
    icon: ShieldCheck,
    href: '/inventory/policies',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
  },
  {
    title: 'Transactions',
    description: 'Audit trail of stock movements, adjustments, and inventory changes.',
    icon: History,
    href: '/inventory/transactions',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950/50',
  },
]

export default function InventoryPage() {
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
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Monitor stock positions, manage adjustments and holds, configure replenishment policies
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INVENTORY_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Card
                  key={link.href}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => navigate({ to: link.href as '/inventory/stock' | '/inventory/low-stock' | '/inventory/adjustments' | '/inventory/holds' | '/inventory/policies' | '/inventory/transactions' })}
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
        </div>
      </Main>
    </>
  )
}
