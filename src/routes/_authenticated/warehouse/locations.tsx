import { createFileRoute } from '@tanstack/react-router'
import LocationsPage from '@/pages/warehouse/Locations'

export const Route = createFileRoute('/_authenticated/warehouse/locations')({
  component: LocationsPage,
})
