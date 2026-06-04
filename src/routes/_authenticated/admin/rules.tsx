import { createFileRoute } from '@tanstack/react-router'
import { BusinessRulesPage } from '@/features/admin/rules/pages/BusinessRulesPage'

export const Route = createFileRoute('/_authenticated/admin/rules')({
  component: BusinessRulesPage,
})
