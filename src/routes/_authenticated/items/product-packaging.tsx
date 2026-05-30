import { createFileRoute } from '@tanstack/react-router'
import ProductPackagingPage from '@/pages/product-packaging/ProductPackaging'

export const Route = createFileRoute('/_authenticated/items/product-packaging')({
  component: ProductPackagingPage,
})
