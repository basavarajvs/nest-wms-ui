import { useQuery } from '@tanstack/react-query'
import { InventoryWebController_getStock } from '@/lib/api/wms-api/wms-web/wms-web'
import type { InventoryWebControllerGetStockParams } from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.stock)) return obj.stock as T[]
    if (Array.isArray(obj.levels)) return obj.levels as T[]
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

export interface StockLevel {
  id?: string
  facilityId?: string
  productId?: string
  locationId?: string
  lotId?: string
  productSku?: string
  productName?: string
  onHand?: number
  allocated?: number
  reserved?: number
  available?: number
  status?: string
}

interface NormalizedStockParams extends Record<string, unknown> {
  facilityId: string
  productId: string
  locationId: string
  lotId: string
  productSku: string
  productName: string
  lowStock: boolean
}

export function useStockLevels(
  params: Partial<InventoryWebControllerGetStockParams> = {}
) {
  const queryParams: InventoryWebControllerGetStockParams = {
    facilityId: params.facilityId || '',
    productId: params.productId || '',
    locationId: params.locationId || '',
    lotId: params.lotId || '',
    productSku: params.productSku || '',
    productName: params.productName || '',
    lowStock: params.lowStock ?? false,
  }

  const stableKey = JSON.stringify(queryParams)

  return useQuery({
    queryKey: ['wms', 'inventory', 'stock', stableKey],
    queryFn: async () => {
      const res = await InventoryWebController_getStock(queryParams)
      return res as unknown
    },
    select: (data) => ({
      levels: safeList<StockLevel>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}
