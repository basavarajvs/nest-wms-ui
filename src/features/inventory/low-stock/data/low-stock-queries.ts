import { useQuery } from '@tanstack/react-query'
import { InventoryWebController_getLowStock } from '@/lib/api/wms-api/wms-web/wms-web'
import type { InventoryWebControllerGetLowStockParams } from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.stock)) return obj.stock as T[]
    if (Array.isArray(obj.alerts)) return obj.alerts as T[]
  }
  return []
}

export interface LowStockAlert {
  id?: string
  facilityId?: string
  productId?: string
  productSku?: string
  productName?: string
  locationId?: string
  onHand?: number
  threshold?: number
  available?: number
  [key: string]: any
}

export function useLowStockAlerts(params: Partial<{ facilityId?: string; threshold?: number; productId?: string }> = {}) {
  // Generated type only declares facilityId; threshold and other filters are passed at runtime (as seen in dashboard usage)
  const queryParams: InventoryWebControllerGetLowStockParams = {
    facilityId: params.facilityId || '',
  }

  return useQuery({
    queryKey: ['wms', 'inventory', 'low-stock', { ...queryParams, threshold: params.threshold ?? 10 }],
    queryFn: async () => {
      const res = await InventoryWebController_getLowStock({
        ...queryParams,
        threshold: params.threshold ?? 10,
      } as any)
      return res as unknown
    },
    select: (data) => ({
      alerts: safeList<LowStockAlert>(data),
    }),
    staleTime: 1000 * 60,
  })
}
