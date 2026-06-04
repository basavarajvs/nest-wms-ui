import { createFileRoute } from '@tanstack/react-router'
import LpnInquiryPage from '@/pages/lpns/LpnInquiryPage'

export const Route = createFileRoute('/_authenticated/lpn-inquiry')({
  component: LpnInquiryPage,
})
