import { createFileRoute } from '@tanstack/react-router'
import ReplenishmentPage from '@/pages/replenishment/ReplenishmentPage'

export const Route = createFileRoute('/_authenticated/replenishment')({
  component: ReplenishmentPage,
})
