import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ShieldCheck } from 'lucide-react'

export function AdminApprovals() {
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
            <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve pending operations
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              Approval Queue
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              This page will display pending approvals for inventory adjustments,
              transfers, and other operations requiring authorization.
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
