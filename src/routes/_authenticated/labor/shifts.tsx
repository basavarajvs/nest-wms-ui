import { createFileRoute } from '@tanstack/react-router'
import ShiftsPageWrapper from '@/pages/labor/ShiftsPage'

export const Route = createFileRoute('/_authenticated/labor/shifts')({
  component: ShiftsPageWrapper,
})
