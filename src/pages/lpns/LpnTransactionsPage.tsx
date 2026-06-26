import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { LpnTransactionsPage as LpnTransactionsFeature } from '@/features/lpns/pages/LpnTransactionsPage'

export function LpnTransactionsPage() {
  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main>
        <LpnTransactionsFeature />
      </Main>
    </>
  )
}
