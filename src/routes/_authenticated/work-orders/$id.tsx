import { createFileRoute } from '@tanstack/react-router'
import { WorkOrderDetailPage } from '@/features/work-orders'

export const Route = createFileRoute('/_authenticated/work-orders/$id')({
  component: WorkOrderDetailPage,
})
