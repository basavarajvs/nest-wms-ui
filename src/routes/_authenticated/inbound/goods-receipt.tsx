import { createFileRoute } from '@tanstack/react-router'
import GrnsPage from '@/pages/inbound/Grns'

export const Route = createFileRoute('/_authenticated/inbound/goods-receipt')({
  component: GrnsPage,
})
