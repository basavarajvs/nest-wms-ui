import { createFileRoute } from '@tanstack/react-router'
import YardVehiclesPageWrapper from '@/pages/warehouse/YardVehiclesPage'

export const Route = createFileRoute('/_authenticated/warehouse/yard-vehicles')({
  component: YardVehiclesPageWrapper,
})
