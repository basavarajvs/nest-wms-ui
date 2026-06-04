import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LpnWebController_list,
  LpnWebController_findById,
  LpnWebController_findByNumber,
  LpnWebController_findByLocation,
  LpnWebController_getChildren,
  LpnWebController_getHierarchy,
  LpnWebController_available,
  LpnWebController_availableForShipment,
  LpnWebController_productAvailableQty,
  LpnWebController_create,
  LpnWebController_update,
  LpnWebController_updateStatus,
  LpnWebController_delete,
  LpnWebController_move,
  LpnWebController_nest,
  LpnWebController_unnest,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateLpnDto,
  UpdateLpnDto,
  UpdateLpnDtoStatus,
  LpnWebControllerListParams,
  LpnWebControllerProductAvailableQtyParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.lpns)) return obj.lpns as T[]
    if (Array.isArray(obj.children)) return obj.children as T[]
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

export interface Lpn {
  id: string
  lpnNumber: string
  lpnType?: string
  facilityId: string
  locationId: string
  productId?: string
  quantity?: number
  uomId: string
  lotNumber?: string
  status?: string
  parentLpnId?: string
  createdAt?: string
  updatedAt?: string
}

export function useLpns(params?: LpnWebControllerListParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'lpns', 'list', stableKey],
    queryFn: async () => {
      const res = await LpnWebController_list(params as LpnWebControllerListParams)
      return res as unknown
    },
    select: (data) => ({
      lpns: safeArray<Lpn>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useLpn(id: string) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'detail', id],
    queryFn: async () => {
      const res = await LpnWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useFindLpnByNumber(lpnNumber: string) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'by-number', lpnNumber],
    queryFn: async () => {
      const res = await LpnWebController_findByNumber(lpnNumber)
      return res as unknown
    },
    enabled: !!lpnNumber,
  })
}

export function useLpnChildren(lpnId: string) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'children', lpnId],
    queryFn: async () => {
      const res = await LpnWebController_getChildren(lpnId)
      return res as unknown
    },
    select: (data) => safeArray<Lpn>(data),
    enabled: !!lpnId,
  })
}

export function useAvailableLpns() {
  return useQuery({
    queryKey: ['wms', 'lpns', 'available'],
    queryFn: async () => {
      const res = await LpnWebController_available()
      return res as unknown
    },
    select: (data) => safeArray<Lpn>(data),
    staleTime: 1000 * 60,
  })
}

export function useAvailableForShipmentLpns() {
  return useQuery({
    queryKey: ['wms', 'lpns', 'available-for-shipment'],
    queryFn: async () => {
      const res = await LpnWebController_availableForShipment()
      return res as unknown
    },
    select: (data) => safeArray<Lpn>(data),
    staleTime: 1000 * 60,
  })
}

export function useCreateLpn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLpnDto) => LpnWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export function useUpdateLpn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLpnDto }) => LpnWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export function useUpdateLpnStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLpnDtoStatus }) => LpnWebController_updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export function useDeleteLpn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => LpnWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export function useMoveLpn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, locationId }: { id: string; locationId: string }) => LpnWebController_move(id, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export function useNestLpn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ childId, parentId }: { childId: string; parentId: string }) => LpnWebController_nest(childId, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export function useUnnestLpn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (childId: string) => LpnWebController_unnest(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'lpns'] })
    },
  })
}

export interface LpnHierarchyNode {
  id: string
  lpnNumber: string
  lpnType?: string
  quantity?: number
  productId?: string
  productName?: string
  productSku?: string
  locationId?: string
  children?: LpnHierarchyNode[]
}

export function useLpnHierarchy(id: string) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'hierarchy', id],
    queryFn: async () => {
      const res = await LpnWebController_getHierarchy(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export interface LpnMovement {
  id: string
  lpnId: string
  fromLocationId: string
  fromLocationName?: string
  toLocationId: string
  toLocationName?: string
  movedBy: string
  movedAt: string
  reason?: string
}

export function useLpnMovementHistory(lpnId: string) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'movements', lpnId],
    queryFn: async () => {
      const res = await LpnWebController_findById(lpnId)
      return res as unknown
    },
    select: (data) => {
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>
        if (Array.isArray(obj.movements)) return obj.movements as LpnMovement[]
        if (Array.isArray(obj.history)) return obj.history as LpnMovement[]
      }
      return [] as LpnMovement[]
    },
    enabled: false,
    staleTime: 1000 * 60,
  })
}

export interface AvailableQtyEntry {
  locationId: string
  locationName?: string
  quantity: number
  uom?: string
}

export function useProductAvailableQty(
  productId: string,
  params?: LpnWebControllerProductAvailableQtyParams
) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'product-available-qty', productId, params],
    queryFn: async () => {
      const res = await LpnWebController_productAvailableQty(
        productId,
        params as LpnWebControllerProductAvailableQtyParams
      )
      return res as unknown
    },
    select: (data) => {
      if (Array.isArray(data)) return data as AvailableQtyEntry[]
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>
        if (Array.isArray(obj.items)) return obj.items as AvailableQtyEntry[]
        if (Array.isArray(obj.data)) return obj.data as AvailableQtyEntry[]
      }
      return []
    },
    enabled: !!productId,
    staleTime: 1000 * 60,
  })
}
