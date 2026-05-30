import { createFileRoute } from '@tanstack/react-router'
import PackingStationsPage from '@/pages/packing-stations/PackingStations'

export const Route = createFileRoute('/_authenticated/warehouse/packing-stations')({
  component: PackingStationsPage,
})
