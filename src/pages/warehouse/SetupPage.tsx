import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings2, MapPin, Layers } from 'lucide-react'
import { WarehouseSetupWizard } from '@/features/warehouse/components/WarehouseSetupWizard'

export default function SetupPage() {
  const [wizardOpen, setWizardOpen] = useState(false)

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
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              <Settings2 className='h-6 w-6' />
              Warehouse Setup
            </h1>
            <p className='text-muted-foreground'>
              Configure warehouse structure and generate locations
            </p>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            <Card className='md:col-span-2'>
              <CardHeader>
                <CardTitle>Location Setup Wizard</CardTitle>
                <CardDescription>
                  Batch-generate the complete location hierarchy including zones, aisles, bays, levels, and locations
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <div className='flex items-center gap-2'>
                    <Layers className='h-4 w-4' />
                    <span>Zones</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    <span>Aisles</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    <span>Bays</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    <span>Levels</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    <span>Locations</span>
                  </div>
                </div>
                <Button onClick={() => setWizardOpen(true)}>
                  <Settings2 className='mr-2 h-4 w-4' />
                  Open Setup Wizard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
                <CardDescription>
                  Tips for warehouse setup
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-2 text-sm text-muted-foreground'>
                <p>Define zones for different storage types (receiving, bulk, pick faces, etc.).</p>
                <p>Each zone can have its own aisle/bay/level/location configuration.</p>
                <p>Location codes are auto-generated using the naming pattern specified.</p>
              </CardContent>
            </Card>
          </div>

          <WarehouseSetupWizard open={wizardOpen} onOpenChange={setWizardOpen} />
        </div>
      </Main>
    </>
  )
}
