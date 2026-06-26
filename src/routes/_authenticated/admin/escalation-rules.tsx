import { createFileRoute } from '@tanstack/react-router'
import { EscalationRulesPage } from '@/features/exception-management/pages/EscalationRulesPage'

export const Route = createFileRoute('/_authenticated/admin/escalation-rules')({
  component: EscalationRulesPage,
})
