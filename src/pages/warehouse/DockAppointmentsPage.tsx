import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DockAppointmentsPage } from '@/features/dock-yard/dock-appointments'

export default function DockAppointmentsPageWrapper() {
  return (
    <>
      <Header><Search /><ThemeSwitch /><ProfileDropdown /></Header>
      <Main><DockAppointmentsPage /></Main>
    </>
  )
}
