import { createFileRoute } from '@tanstack/react-router'
import ProductSuppliersPage from '@/pages/product-suppliers/ProductSuppliers'

export const Route = createFileRoute('/_authenticated/items/product-suppliers')({
  component: ProductSuppliersPage,
})
