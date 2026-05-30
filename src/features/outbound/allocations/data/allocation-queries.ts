import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  OutboundWebController_getPendingAllocations,
  OutboundWebController_overrideAllocation,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  AllocationOverrideDto,
  OutboundWebControllerGetPendingAllocationsParams,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.allocations)) return obj.allocations as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeList(obj).length || fallback
  }
  return fallback
}

export interface PendingAllocation {
  id?: string
  orderId?: string
  productId?: string
  productSku?: string
  productName?: string
  quantity?: number
  locationId?: string
  lotId?: string
  status?: string
}

export function usePendingAllocations(
  params: Partial<OutboundWebControllerGetPendingAllocationsParams> = {}
) {
  const queryParams: OutboundWebControllerGetPendingAllocationsParams = {
    facilityId: params.facilityId || '',
  }

  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'outbound', 'pending-allocations', stableKey],
    queryFn: async () => {
      const res = await OutboundWebController_getPendingAllocations(queryParams)
      return res as unknown
    },
    select: (data) => ({
      allocations: safeList<PendingAllocation>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useOverrideAllocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: AllocationOverrideDto) => {
      return OutboundWebController_overrideAllocation(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wms', 'outbound', 'pending-allocations'],
      })
    },
  })
}
