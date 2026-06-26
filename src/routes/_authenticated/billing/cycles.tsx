import { createFileRoute } from '@tanstack/react-router'
import BillingCyclesPageWrapper from '@/pages/billing/BillingCyclesPage'

export const Route = createFileRoute('/_authenticated/billing/cycles')({
  component: BillingCyclesPageWrapper,
})
