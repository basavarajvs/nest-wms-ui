import { createFileRoute } from '@tanstack/react-router'
import { CountMetricsPage } from '@/pages/counts/CountMetricsPage'

export const Route = createFileRoute('/_authenticated/counts/metrics')({
  component: CountMetricsPage,
})
