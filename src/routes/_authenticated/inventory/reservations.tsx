import { createFileRoute } from '@tanstack/react-router'
import InventoryReservationsPage from '@/pages/inventory-reservations/InventoryReservations'

export const Route = createFileRoute('/_authenticated/inventory/reservations')({
  component: InventoryReservationsPage,
})
