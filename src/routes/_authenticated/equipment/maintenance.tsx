import { createFileRoute } from '@tanstack/react-router'
import MaintenanceRecordsPageWrapper from '@/pages/equipment/MaintenanceRecordsPage'

export const Route = createFileRoute('/_authenticated/equipment/maintenance')({
  component: MaintenanceRecordsPageWrapper,
})
