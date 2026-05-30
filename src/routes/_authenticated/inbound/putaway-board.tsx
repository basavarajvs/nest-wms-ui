import { createFileRoute } from '@tanstack/react-router'
import PutawayBoardPage from '@/pages/inbound/PutawayBoard'

export const Route = createFileRoute('/_authenticated/inbound/putaway-board')({
  component: PutawayBoardPage,
})
