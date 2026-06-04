import { useFacility } from '@/hooks/useFacility'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { BayManagementPage } from '@/features/warehouse/pages/BayManagementPage'

export default function BaysPage() {
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
            <h1 className='text-2xl font-bold tracking-tight'>Bay Management</h1>
            <p className='text-muted-foreground'>Manage bays within aisles</p>
          </div>
          <BayManagementPage facilityId={facilityId} />
        </div>
      </Main>
    </>
  )
}
