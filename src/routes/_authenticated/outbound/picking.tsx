import { createFileRoute } from '@tanstack/react-router'
import { PickingPage } from '@/pages/outbound/PickingPage'

export const Route = createFileRoute('/_authenticated/outbound/picking')({
  component: PickingPage,
})
