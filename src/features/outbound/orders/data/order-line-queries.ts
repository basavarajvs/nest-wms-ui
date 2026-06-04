import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  OrderLineWebController_findAll,
  OrderLineWebController_create,
  OrderLineWebController_update,
  OrderLineWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateOrderLineDto,
  UpdateOrderLineDto,
  OrderLineWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.lines)) return obj.lines as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeArray(data).length || fallback
  }
  return fallback
}

export interface OrderLine {
  id: string
  orderId: string
  productId: string
  productName?: string
  productSku?: string
  quantity: number
  allocatedQuantity?: number
  pickedQuantity?: number
  packedQuantity?: number
  shippedQuantity?: number
  uomId: string
  unitPrice?: number
  notes?: string
  lineNumber?: number
  createdAt?: string
  updatedAt?: string
}

export function useOrderLines(orderId: string, params?: Omit<OrderLineWebControllerFindAllParams, 'orderId'>) {
  const stableKey = JSON.stringify({ orderId, ...params })
  return useQuery({
    queryKey: ['wms', 'outbound', 'orders', 'lines', stableKey],
    queryFn: async () => {
      const res = await OrderLineWebController_findAll({
        orderId,
        ...params,
      } as OrderLineWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      lines: safeArray<OrderLine>(data),
      total: safeTotal(data),
    }),
    enabled: !!orderId,
    staleTime: 1000 * 30,
  })
}

export function useCreateOrderLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateOrderLineDto) => OrderLineWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'orders', 'lines'] })
    },
  })
}

export function useUpdateOrderLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOrderLineDto }) => OrderLineWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'orders', 'lines'] })
    },
  })
}

export function useDeleteOrderLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => OrderLineWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'orders', 'lines'] })
    },
  })
}
