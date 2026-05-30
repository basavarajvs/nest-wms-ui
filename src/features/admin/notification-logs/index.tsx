import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Bell } from 'lucide-react'

export function AdminNotificationLogs() {
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
            <h1 className="text-2xl font-bold tracking-tight">Notification Logs</h1>
            <p className="text-muted-foreground">
              View system notification history and delivery status
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              Notification History
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Notification logs will display a searchable history of all
              system-generated notifications with delivery status tracking.
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
