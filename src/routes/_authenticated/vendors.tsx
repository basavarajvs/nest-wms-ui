import { createFileRoute } from '@tanstack/react-router'
import VendorsPage from '@/pages/vendors/Vendors'

export const Route = createFileRoute('/_authenticated/vendors')({
  component: VendorsPage,
})
