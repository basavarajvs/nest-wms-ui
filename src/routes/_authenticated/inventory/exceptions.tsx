import { createFileRoute } from '@tanstack/react-router'
import ExceptionsPage from '@/pages/exception-management/Exceptions'

export const Route = createFileRoute('/_authenticated/inventory/exceptions')({
  component: ExceptionsPage,
})
