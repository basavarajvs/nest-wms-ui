import { createFileRoute } from '@tanstack/react-router'
import ClientRatesPageWrapper from '@/pages/billing/ClientRatesPage'

export const Route = createFileRoute('/_authenticated/billing/client-rates')({
  component: ClientRatesPageWrapper,
})
