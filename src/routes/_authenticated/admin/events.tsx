import { createFileRoute } from '@tanstack/react-router'
import { EventsBrowser } from '@/features/admin/audit-logs/components/EventsBrowser'

export const Route = createFileRoute('/_authenticated/admin/events')({
  component: EventsBrowser,
})
