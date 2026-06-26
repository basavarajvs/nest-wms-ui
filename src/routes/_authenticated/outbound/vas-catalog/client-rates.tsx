import { createFileRoute } from '@tanstack/react-router'
import VasClientRatesPageWrapper from '@/pages/vas-catalog/VasClientRatesPage'

export const Route = createFileRoute('/_authenticated/outbound/vas-catalog/client-rates')({
  component: VasClientRatesPageWrapper,
})
