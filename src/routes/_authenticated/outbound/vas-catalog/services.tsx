import { createFileRoute } from '@tanstack/react-router'
import VasServicesPageWrapper from '@/pages/vas-catalog/VasServicesPage'

export const Route = createFileRoute('/_authenticated/outbound/vas-catalog/services')({
  component: VasServicesPageWrapper,
})
