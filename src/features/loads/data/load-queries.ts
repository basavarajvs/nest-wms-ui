import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LoadWebController_findAll,
  LoadWebController_findById,
  LoadWebController_findByLoadNumber,
  LoadWebController_create,
  LoadWebController_update,
  LoadWebController_delete,
  LoadWebController_markLoaded,
  LoadWebController_markDeparted,
  OutboundWebController_assignShipmentToLoad,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateLoadDto,
  UpdateLoadDto,
  ShipmentLoadDto,
  LoadWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.loads)) return obj.loads as T[]
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

export interface LoadShipment {
  id: string
  shipmentId?: string
  orderNumber?: string
  carrierCode?: string
  status?: string
}

export interface Load {
  id: string
  loadNumber: string
  facilityId: string
  carrierCode?: string
  dockDoorCode?: string
  driverName?: string
  driverPhone?: string
  vehiclePlate?: string
  status?: string
  notes?: string
  shipmentIds?: string[]
  shipments?: LoadShipment[]
  createdAt?: string
  updatedAt?: string
}

export function useLoads(params?: Partial<LoadWebControllerFindAllParams>) {
  const queryParams: LoadWebControllerFindAllParams = {
    facilityId: params?.facilityId || '',
    status: params?.status || '',
  }
  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'loads', 'list', stableKey],
    queryFn: async () => {
      const res = await LoadWebController_findAll(queryParams)
      return res as unknown
    },
    select: (data) => ({
      loads: safeArray<Load>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useLoad(id: string) {
  return useQuery({
    queryKey: ['wms', 'loads', 'detail', id],
    queryFn: async () => {
      const res = await LoadWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Load>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useLoadShipments(loadId: string) {
  return useQuery({
    queryKey: ['wms', 'loads', 'shipments', loadId],
    queryFn: async () => {
      const res = await LoadWebController_findById(loadId)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<LoadShipment>(data)
      return items
    },
    enabled: !!loadId,
  })
}

export function useFindLoadByNumber(loadNumber: string) {
  return useQuery({
    queryKey: ['wms', 'loads', 'by-number', loadNumber],
    queryFn: async () => {
      const res = await LoadWebController_findByLoadNumber(loadNumber)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Load>(data)
      return items[0] ?? null
    },
    enabled: !!loadNumber,
  })
}

export function useCreateLoad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLoadDto) => LoadWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
    },
  })
}

export function useUpdateLoad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLoadDto }) =>
      LoadWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
    },
  })
}

export function useUpdateLoadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      LoadWebController_update(id, { status } as UpdateLoadDto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
    },
  })
}

export function useDeleteLoad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => LoadWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
    },
  })
}

export function useMarkLoadLoaded() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => LoadWebController_markLoaded(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
    },
  })
}

export function useMarkLoadDeparted() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => LoadWebController_markDeparted(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
    },
  })
}

export function useAssignShipmentToLoad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ShipmentLoadDto) =>
      OutboundWebController_assignShipmentToLoad(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loads'] })
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'shipments'] })
    },
  })
}
