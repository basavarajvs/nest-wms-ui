import { createFileRoute } from '@tanstack/react-router'
import { AdminNotificationLogs } from '@/features/admin/notification-logs'

export const Route = createFileRoute('/_authenticated/admin/notifications')({
  component: AdminNotificationLogs,
})
