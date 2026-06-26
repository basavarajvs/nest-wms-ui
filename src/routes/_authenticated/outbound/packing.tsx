import { createFileRoute } from '@tanstack/react-router'
import { PackingPage } from '@/pages/outbound/PackingPage'

export const Route = createFileRoute('/_authenticated/outbound/packing')({
  component: PackingPage,
})
