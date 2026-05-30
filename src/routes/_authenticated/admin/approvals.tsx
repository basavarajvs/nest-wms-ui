import { createFileRoute } from '@tanstack/react-router'
import { AdminApprovals } from '@/features/admin/approvals'

export const Route = createFileRoute('/_authenticated/admin/approvals')({
  component: AdminApprovals,
})
