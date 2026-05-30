import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/pages/outbound/Orders'

export const Route = createFileRoute('/_authenticated/outbound/orders')({
  component: Orders,
})
