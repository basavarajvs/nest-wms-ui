import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TimeLogsPage } from '@/features/labor'

export default function TimeLogsPageWrapper() {
  return (
    <>
      <Header><Search /><ThemeSwitch /><ProfileDropdown /></Header>
      <Main><TimeLogsPage /></Main>
    </>
  )
}
