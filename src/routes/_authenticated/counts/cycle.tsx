import { createFileRoute } from '@tanstack/react-router'
import { CycleCounts } from '@/features/cycle-counts'

export const Route = createFileRoute('/_authenticated/counts/cycle')({
  component: CycleCounts,
})
