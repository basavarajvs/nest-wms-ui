import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PackingStationsWebController_findAll,
  PackingStationsWebController_findById,
  PackingStationsWebController_create,
  PackingStationsWebController_update,
  PackingStationsWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreatePackingStationDto, UpdatePackingStationDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.packingStations)) return obj.packingStations as T[]
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

export interface PackingStation {
  id: string
  stationCode: string
  stationName?: string
  facilityId: string
  locationId?: string
  description?: string
  isAvailable?: boolean
  isActive?: boolean
  printerType?: string
  scaleType?: string
  scannerType?: string
  createdAt?: string
}

export function usePackingStations() {
  return useQuery({
    queryKey: ['wms', 'packing-stations', 'list'],
    queryFn: async () => {
      const res = await PackingStationsWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      packingStations: safeArray<PackingStation>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePackingStation(id: string) {
  return useQuery({
    queryKey: ['wms', 'packing-stations', 'detail', id],
    queryFn: async () => {
      const res = await PackingStationsWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreatePackingStation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePackingStationDto) => PackingStationsWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing-stations'] })
    },
  })
}

export function useUpdatePackingStation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePackingStationDto }) => PackingStationsWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing-stations'] })
    },
  })
}

export function useDeletePackingStation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PackingStationsWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing-stations'] })
    },
  })
}
