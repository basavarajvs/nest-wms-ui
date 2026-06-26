import { createFileRoute } from '@tanstack/react-router'
import VasWorkstationsPageWrapper from '@/pages/vas-catalog/VasWorkstationsPage'

export const Route = createFileRoute('/_authenticated/outbound/vas-catalog/workstations')({
  component: VasWorkstationsPageWrapper,
})
