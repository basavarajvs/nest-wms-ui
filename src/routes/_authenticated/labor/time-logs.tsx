import { createFileRoute } from '@tanstack/react-router'
import TimeLogsPageWrapper from '@/pages/labor/TimeLogsPage'

export const Route = createFileRoute('/_authenticated/labor/time-logs')({
  component: TimeLogsPageWrapper,
})
