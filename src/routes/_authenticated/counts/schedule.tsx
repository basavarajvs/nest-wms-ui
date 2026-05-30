import { createFileRoute } from '@tanstack/react-router'
import { ScheduleCountPage } from '@/pages/counts/ScheduleCountPage'

export const Route = createFileRoute('/_authenticated/counts/schedule')({
  component: ScheduleCountPage,
})
