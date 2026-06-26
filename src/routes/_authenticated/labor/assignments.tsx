import { createFileRoute } from '@tanstack/react-router'
import AssignmentsPageWrapper from '@/pages/labor/AssignmentsPage'

export const Route = createFileRoute('/_authenticated/labor/assignments')({
  component: AssignmentsPageWrapper,
})
