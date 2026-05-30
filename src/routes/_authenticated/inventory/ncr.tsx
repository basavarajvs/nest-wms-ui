import { createFileRoute } from '@tanstack/react-router'
import NcrsPage from '@/pages/ncr/Ncrs'

export const Route = createFileRoute('/_authenticated/inventory/ncr')({
  component: NcrsPage,
})
