import { createFileRoute } from '@tanstack/react-router'
import VasExecutionPage from '@/pages/vas-execution/VasExecution'

export const Route = createFileRoute('/_authenticated/outbound/vas-execution')({
  component: VasExecutionPage,
})
