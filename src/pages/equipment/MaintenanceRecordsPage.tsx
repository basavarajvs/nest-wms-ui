import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { MaintenanceRecordsPage } from '@/features/equipment'

export default function MaintenanceRecordsPageWrapper() {
  return (
    <>
      <Header><Search /><ThemeSwitch /><ProfileDropdown /></Header>
      <Main><MaintenanceRecordsPage /></Main>
    </>
  )
}
