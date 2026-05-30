import { createFileRoute } from '@tanstack/react-router'
import CarriersPage from '@/pages/carriers/Carriers'

export const Route = createFileRoute('/_authenticated/carriers')({
  component: CarriersPage,
})
