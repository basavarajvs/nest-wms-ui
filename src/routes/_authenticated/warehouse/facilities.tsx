import { createFileRoute } from '@tanstack/react-router'
import FacilitiesPage from '@/pages/warehouse/Facilities'

export const Route = createFileRoute('/_authenticated/warehouse/facilities')({
  component: FacilitiesPage,
})
