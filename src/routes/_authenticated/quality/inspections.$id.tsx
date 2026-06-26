import { createFileRoute } from '@tanstack/react-router'
import { InspectionDetailPage } from '@/features/quality/inspections'

export const Route = createFileRoute('/_authenticated/quality/inspections/$id')({
  component: InspectionDetailRoute,
})

function InspectionDetailRoute() {
  const { id } = Route.useParams()
  return <InspectionDetailPage inspectionId={id} />
}
