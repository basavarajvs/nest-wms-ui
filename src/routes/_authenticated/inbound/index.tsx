import { createFileRoute } from '@tanstack/react-router'
import InboundPage from '@/pages/inbound/Inbound'

export const Route = createFileRoute('/_authenticated/inbound/')({
  component: InboundPage,
})
