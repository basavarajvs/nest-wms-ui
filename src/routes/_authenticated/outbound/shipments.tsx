import { createFileRoute } from '@tanstack/react-router'
import { Shipments } from '@/pages/outbound/Shipments'

export const Route = createFileRoute('/_authenticated/outbound/shipments')({
  component: Shipments,
})
