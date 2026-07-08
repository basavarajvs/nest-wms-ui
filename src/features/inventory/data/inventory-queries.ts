import { useQuery } from '@tanstack/react-query'
import { useFacilityStore } from '@/stores/facility-store'
import { OnHandWebController_findAll } from '@/lib/wms-api/api/wms-api/inventory/inventory'
import { ProductController_findAll } from '@/lib/wms-api/api/wms-api/products/products'
import { LocationController_findAll } from '@/lib/wms-api/api/wms-api/storage-locations/storage-locations'
import type { InventoryOnHandResponseDto } from '@/lib/wms-api/types/wms-api'
import type { Envelope } from '@/features/asns/types/asn'

export interface InventoryQueryParams {
  page?: number
  limit?: number
  search?: string
  product_id?: string
  location_id?: string
  status?: string
}

export function useCurrentInventoryList(params?: InventoryQueryParams) {
  return useQuery({
    queryKey: ['wms', 'inventory', 'on-hand', 'list', params],
    queryFn: async () => {
      const res = (await OnHandWebController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search, product_id: params?.product_id, location_id: params?.location_id, status: params?.status },
      } as RequestInit)) as unknown as Envelope<{ data: InventoryOnHandResponseDto[]; total: number; page: number; limit: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0, page: res.data?.page ?? 1, limit: res.data?.limit ?? 20 }
    },
  })
}

interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export function useProductLookup() {
  return useQuery({
    queryKey: ['wms', 'products', 'lookup'],
    queryFn: async () => {
      const res = (await ProductController_findAll()) as unknown as Envelope<PaginatedData<{ product_id: number; product_name: string }>>
      const items = res.data?.data ?? []
      return items as { product_id: number; product_name: string }[]
    },
    staleTime: 300000,
    gcTime: 300000,
  })
}

export function useLocationLookup() {
  const facilityId = useFacilityStore((s) => s.facilityId)
  return useQuery({
    queryKey: ['wms', 'locations', 'lookup', facilityId],
    queryFn: async () => {
      const params = { facilityId: String(facilityId) }
      const res = (await LocationController_findAll({ params } as RequestInit)) as unknown as Envelope<PaginatedData<{ location_id: number; location_name: string; location_code?: string }>>
      const items = res.data?.data ?? []
      return items as { location_id: number; location_name: string; location_code?: string }[]
    },
    enabled: !!facilityId,
    staleTime: 300000,
    gcTime: 300000,
  })
}

export function computeAvailableQty(record: InventoryOnHandResponseDto): number {
  return Math.max(0, record.quantity_on_hand - record.quantity_allocated - record.quantity_reserved - record.quantity_picked - record.quantity_damaged - record.quantity_on_hold)
}

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'ALLOCATED', label: 'Allocated' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
] as const

export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'In Stock',
  ALLOCATED: 'Allocated',
  ON_HOLD: 'On Hold',
  DAMAGED: 'Damaged',
  OUT_OF_STOCK: 'Out of Stock',
}
