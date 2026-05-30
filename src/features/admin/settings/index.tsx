import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Settings } from 'lucide-react'

export function AdminSettings() {
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
            <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-muted-foreground">
              System-wide configuration and preferences
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Settings className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              Admin Settings
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              System settings management is not yet available via the exposed API.
              This page will provide tenant-level configuration options.
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
