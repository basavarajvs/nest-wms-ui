import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { FileText } from 'lucide-react'

export function AdminCustomization() {
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
            <h1 className="text-2xl font-bold tracking-tight">Customization</h1>
            <p className="text-muted-foreground">
              Customize labels, business rules, and workflow configurations
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              Customization Options
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Customization features will allow configuration of label templates,
              business rule overrides, and workflow customizations for your
              warehouse operations.
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
