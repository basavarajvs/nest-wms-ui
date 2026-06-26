import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { InvoiceDetailPage } from '@/features/billing'

interface Props {
  invoiceId: string
}

export default function InvoiceDetailPageWrapper({ invoiceId }: Props) {
  return (
    <>
      <Header><Search /><ThemeSwitch /><ConfigDrawer /><ProfileDropdown /></Header>
      <Main><InvoiceDetailPage invoiceId={invoiceId} /></Main>
    </>
  )
}
