import { createFileRoute } from '@tanstack/react-router'
import { InspectionListPage } from '@/features/quality/inspections'

export const Route = createFileRoute('/_authenticated/quality/inspections')({
  component: InspectionListPage,
})
