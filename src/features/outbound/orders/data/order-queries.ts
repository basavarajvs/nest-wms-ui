import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  OutboundWebController_listOrders,
  OutboundWebController_createOrder,
  OutboundWebController_overrideAllocation,
  OutboundWebController_updateOrderStatus,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateOrderDto,
  AllocationOverrideDto,
  OutboundWebControllerListOrdersParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.orders)) return obj.orders as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeArray(obj).length || fallback
  }
  return fallback
}

export interface Order {
  id: string
  orderNumber?: string
  clientCode?: string
  facilityId?: string
  customerId?: string
  status?: string
  priority?: number
  orderDate?: string
  requestedDeliveryDate?: string
  currencyCode?: string
  totalOrderValue?: number
  confirmedDate?: string
  shippedDate?: string
  deliveredDate?: string
  createdAt?: string
  orderType?: string
  notes?: string
}

export function useOrders(
  params?: Partial<OutboundWebControllerListOrdersParams>
) {
  const queryParams: OutboundWebControllerListOrdersParams = {
    status: params?.status || '',
    clientCode: params?.clientCode || '',
    facilityId: params?.facilityId || '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  }

  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'outbound', 'orders', stableKey],
    queryFn: async () => {
      const res = await OutboundWebController_listOrders(queryParams)
      return res as unknown
    },
    select: (data) => ({
      orders: safeArray<Order>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateOrderDto) => {
      return OutboundWebController_createOrder(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'orders'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return OutboundWebController_updateOrderStatus(id, { status: 'CANCELLED' as const })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'orders'] })
    },
  })
}

export function useOverrideAllocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: AllocationOverrideDto) => {
      return OutboundWebController_overrideAllocation(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'allocations'] })
    },
  })
}
