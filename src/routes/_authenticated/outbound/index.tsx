import { createFileRoute } from '@tanstack/react-router'
import OutboundPage from '@/pages/outbound/Outbound'

export const Route = createFileRoute('/_authenticated/outbound/')({
  component: OutboundPage,
})
