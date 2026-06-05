import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  OutboundWebController_generateManifest,
  OutboundWebController_listShipments,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { GenerateManifestDto, OutboundWebControllerListShipmentsParams } from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.shipments)) return obj.shipments as T[]
  }
  return []
}

export interface Shipment {
  id: string
  orderId?: string
  orderNumber?: string
  carrierCode?: string
  carrierName?: string
  trackingNumber?: string
  status?: string
  destination?: string
  totalWeight?: number
  totalVolume?: number
  createdAt?: string
  shippedAt?: string
  deliveryStatus?: string
  facilityId?: string
}

export function useShipments(params?: Partial<OutboundWebControllerListShipmentsParams>) {
  const queryParams: OutboundWebControllerListShipmentsParams = {
    status: params?.status || '',
    facilityId: params?.facilityId || '',
    loadId: params?.loadId || '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  }

  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'outbound', 'shipments', stableKey],
    queryFn: async () => {
      const res = await OutboundWebController_listShipments(queryParams)
      return res as unknown
    },
    select: (data) => ({
      shipments: safeList<Shipment>(data),
      total: safeList<Shipment>(data).length || 0,
    }),
    staleTime: 1000 * 60,
  })
}

export function useGenerateManifest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: GenerateManifestDto) => {
      return OutboundWebController_generateManifest(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'shipments'] })
    },
  })
}
