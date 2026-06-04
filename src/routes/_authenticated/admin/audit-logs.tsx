import { createFileRoute } from '@tanstack/react-router'
import { AuditLogsPage } from '@/features/admin/audit-logs/pages/AuditLogsPage'

export const Route = createFileRoute('/_authenticated/admin/audit-logs')({
  component: AuditLogsPage,
})
