import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { CycleCountExecutionPage } from '@/features/cycle-counts/pages/CycleCountExecutionPage'
import { ScheduleCountForm } from './ScheduleCount'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function CycleCounts() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Header>
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
        <Button size='sm' onClick={() => setDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Schedule Count
        </Button>
      </Header>
      <Main>
        <div className="space-y-6">
          <CycleCountExecutionPage />
        </div>
      </Main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Schedule Cycle Count</DialogTitle>
            <DialogDescription>
              Define the scope and method for a new counting operation
            </DialogDescription>
          </DialogHeader>
          <ScheduleCountForm
            onSuccess={() => setDialogOpen(false)}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
