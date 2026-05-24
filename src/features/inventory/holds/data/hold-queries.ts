import { useQuery } from '@tanstack/react-query'
import { InventoryWebController_listHolds } from '@/lib/api/wms-api/wms-web/wms-web'
import type { InventoryWebControllerListHoldsParams } from '@/lib/types/wms-api'

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
  reason?: string
  status?: string
  createdAt?: string
  [key: string]: any
}

export function useHolds(params: Partial<InventoryWebControllerListHoldsParams> = {}) {
  const queryParams: InventoryWebControllerListHoldsParams = {
    status: params.status || '',
    facilityId: params.facilityId || '',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }

  return useQuery({
    queryKey: ['wms', 'inventory', 'holds', queryParams],
    queryFn: async () => {
      const res = await InventoryWebController_listHolds(queryParams as any)
      return res as unknown
    },
    select: (data) => ({
      holds: safeList<Hold>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}
