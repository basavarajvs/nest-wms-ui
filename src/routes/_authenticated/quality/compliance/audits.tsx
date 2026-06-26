import { createFileRoute } from '@tanstack/react-router'
import { ComplianceAuditsPage } from '@/features/quality/compliance'

export const Route = createFileRoute('/_authenticated/quality/compliance/audits')({
  component: ComplianceAuditsPage,
})
