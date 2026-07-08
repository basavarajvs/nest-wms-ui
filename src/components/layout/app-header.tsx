import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { FacilitySwitcher } from './facility-switcher'
import { ClientSwitcher } from './client-switcher'
import { TenantDisplay } from './tenant-display'
import { ThemeSwitcher } from './theme-switcher'
import { UserMenu } from './user-menu'

export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <TenantDisplay />
        </div>
        <div className="flex items-center gap-2">
          <ClientSwitcher />
          <span className="text-muted-foreground/30 text-xs">|</span>
          <FacilitySwitcher />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <ThemeSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
