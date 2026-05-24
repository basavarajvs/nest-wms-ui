import { createFileRoute } from '@tanstack/react-router'
import { GoodsReceipt } from '@/features/inbound/goods-receipt'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inbound/goods-receipt')({
  component: GoodsReceipt,
})
