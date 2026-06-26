import { createFileRoute } from '@tanstack/react-router'
import PerformancePageWrapper from '@/pages/labor/PerformancePage'

export const Route = createFileRoute('/_authenticated/labor/performance')({
  component: PerformancePageWrapper,
})
