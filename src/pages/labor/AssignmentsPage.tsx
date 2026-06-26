import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AssignmentsPage } from '@/features/labor'

export default function AssignmentsPageWrapper() {
  return (
    <>
      <Header><Search /><ThemeSwitch /><ProfileDropdown /></Header>
      <Main><AssignmentsPage /></Main>
    </>
  )
}
