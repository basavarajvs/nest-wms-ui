import { useNavigate } from '@tanstack/react-router'
import { ArrowDownToLine, Truck, ClipboardCheck, LayoutDashboard, ArrowRight } from 'lucide-react'
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

const INBOUND_LINKS = [
  {
    title: 'Advance Ship Notices',
    description: 'Create and manage ASNs from vendors. Preview documents and update shipment statuses.',
    icon: Truck,
    href: '/inbound/asns',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  {
    title: 'Goods Receipt Notes',
    description: 'Create GRNs from ASNs or ad-hoc. Track receiving progress and view detailed status.',
    icon: ClipboardCheck,
    href: '/inbound/grns',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  {
    title: 'Putaway Board',
    description: 'Real-time view of putaway tasks. Filter by status, priority, and assignee.',
    icon: LayoutDashboard,
    href: '/inbound/putaway-board',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
  },
]

export default function InboundPage() {
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
            <h1 className="text-2xl font-bold tracking-tight">Inbound Operations</h1>
            <p className="text-muted-foreground">
              Manage the complete inbound flow — from ASN creation through goods receipt to putaway
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {INBOUND_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Card
                  key={link.href}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => navigate({ to: link.href as '/inbound/asns' | '/inbound/grns' | '/inbound/putaway-board' })}
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
                <ArrowDownToLine className="h-5 w-5 text-primary" />
                Inbound Process Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</div>
                  <p className="mt-1 text-sm font-medium">ASN Creation</p>
                  <p className="text-xs text-muted-foreground mt-1">Register inbound shipments from vendors</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">2</div>
                  <p className="mt-1 text-sm font-medium">Goods Receipt</p>
                  <p className="text-xs text-muted-foreground mt-1">Receive items against ASN or ad-hoc</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</div>
                  <p className="mt-1 text-sm font-medium">QC Inspection</p>
                  <p className="text-xs text-muted-foreground mt-1">Quality check received items</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">4</div>
                  <p className="mt-1 text-sm font-medium">Putaway</p>
                  <p className="text-xs text-muted-foreground mt-1">Move items to storage locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
