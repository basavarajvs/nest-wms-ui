import { createFileRoute } from '@tanstack/react-router'
import ProductClientAssignmentsPage from '@/pages/product-client-assignments/ProductClientAssignments'

export const Route = createFileRoute('/_authenticated/items/product-client-assignments')({
  component: ProductClientAssignmentsPage,
})
