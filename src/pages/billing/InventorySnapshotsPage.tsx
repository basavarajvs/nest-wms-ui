import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { InventorySnapshotsPage } from '@/features/billing'

export default function InventorySnapshotsPageWrapper() {
  return (
    <>
      <Header><Search /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main><InventorySnapshotsPage /></Main>
    </>
  )
}
