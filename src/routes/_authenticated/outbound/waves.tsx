import { createFileRoute } from '@tanstack/react-router'
import { Waves } from '@/pages/outbound/Waves'

export const Route = createFileRoute('/_authenticated/outbound/waves')({
  component: Waves,
})
