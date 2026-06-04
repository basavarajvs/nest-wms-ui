import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InventoryWebController_listHolds,
  InventoryWebController_createHold,
  InventoryWebController_releaseHold,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  InventoryWebControllerListHoldsParams,
  CreateHoldDto,
  ReleaseHoldDto,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.holds)) return obj.holds as T[]
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

export interface Hold {
  id: string
  facilityId?: string
  productId?: string
  locationId?: string
  lotId?: string
  quantity?: number
  qty?: number
  reason?: string
  holdType?: string
  status?: string
  createdAt?: string
  releasedAt?: string
  productName?: string
  productSku?: string
}

interface HoldQueryParams {
  status?: string
  facilityId?: string
  page?: number
  limit?: number
  holdType?: string
  locationId?: string
}

export function useHolds(
  params: HoldQueryParams = {}
) {
  const queryParams: InventoryWebControllerListHoldsParams = {
    status: params.status || '',
    facilityId: params.facilityId || '',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }

  const combined = { ...queryParams, holdType: params.holdType, locationId: params.locationId }
  const stableKey = JSON.stringify(combined)

  return useQuery({
    queryKey: ['wms', 'inventory', 'holds', stableKey],
    queryFn: async () => {
      const res = await InventoryWebController_listHolds(combined as InventoryWebControllerListHoldsParams)
      return res as unknown
    },
    select: (data) => ({
      holds: safeList<Hold>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateHoldDto) => {
      return InventoryWebController_createHold(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'holds'] })
    },
  })
}

export function useReleaseHold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto?: ReleaseHoldDto }) => {
      return InventoryWebController_releaseHold(id, dto ?? {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'holds'] })
    },
  })
}
