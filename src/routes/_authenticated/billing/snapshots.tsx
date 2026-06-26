import { createFileRoute } from '@tanstack/react-router'
import InventorySnapshotsPageWrapper from '@/pages/billing/InventorySnapshotsPage'

export const Route = createFileRoute('/_authenticated/billing/snapshots')({
  component: InventorySnapshotsPageWrapper,
})
