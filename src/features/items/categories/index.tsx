import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Tags } from 'lucide-react'

export function Categories() {
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
            <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage product categories and classifications
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Tags className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              Product Categories
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Category management is not yet available via the exposed API.
              This page will provide CRUD operations for product categories once
              the backend endpoints are available.
            </p>
          </div>
        </div>
      </Main>
    </>
  )
}
