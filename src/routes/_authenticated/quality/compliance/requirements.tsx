import { createFileRoute } from '@tanstack/react-router'
import { ComplianceRequirementsPage } from '@/features/quality/compliance'

export const Route = createFileRoute('/_authenticated/quality/compliance/requirements')({
  component: ComplianceRequirementsPage,
})
