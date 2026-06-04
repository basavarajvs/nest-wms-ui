import { useFacility } from '@/hooks/useFacility'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { LevelManagementPage } from '@/features/warehouse/pages/LevelManagementPage'

export default function LevelsPage() {
  const { selectedFacility } = useFacility()
  const facilityId = selectedFacility?.id || ''

  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='space-y-6'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Level Management</h1>
            <p className='text-muted-foreground'>Manage levels within racks</p>
          </div>
          <LevelManagementPage facilityId={facilityId} />
        </div>
      </Main>
    </>
  )
}
