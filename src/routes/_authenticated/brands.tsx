import { createFileRoute } from '@tanstack/react-router'
import BrandsPage from '@/pages/brands/Brands'

export const Route = createFileRoute('/_authenticated/brands')({
  component: BrandsPage,
})
