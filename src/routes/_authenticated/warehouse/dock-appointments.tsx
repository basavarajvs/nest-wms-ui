import { createFileRoute } from '@tanstack/react-router'
import DockAppointmentsPageWrapper from '@/pages/warehouse/DockAppointmentsPage'

export const Route = createFileRoute('/_authenticated/warehouse/dock-appointments')({
  component: DockAppointmentsPageWrapper,
})
