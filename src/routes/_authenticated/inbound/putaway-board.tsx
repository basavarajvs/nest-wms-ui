import { createFileRoute } from '@tanstack/react-router'
import { PutawayBoard } from '@/features/inbound/putaway-board'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inbound/putaway-board')({
  component: PutawayBoard,
})
