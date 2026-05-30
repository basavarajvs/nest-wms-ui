import { createFileRoute } from '@tanstack/react-router'
import ZonesPage from '@/pages/warehouse/Zones'

export const Route = createFileRoute('/_authenticated/warehouse/zones')({
  component: ZonesPage,
})
