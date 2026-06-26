import { createFileRoute } from '@tanstack/react-router'
import EquipmentListPageWrapper from '@/pages/equipment/EquipmentListPage'

export const Route = createFileRoute('/_authenticated/equipment/')({
  component: EquipmentListPageWrapper,
})
