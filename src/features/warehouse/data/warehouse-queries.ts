import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  WarehouseFacilityController_findAllWeb,
  WarehouseZoneController_findAllWeb,
  StorageLocationController_findAllWeb,
  StorageLocationController_createWeb,
  StorageLocationController_updateWeb,
} from '@/lib/api/wms-api/master-data/master-data'
import type {
  CreateLocationDto,
  UpdateLocationDto,
  WarehouseZoneControllerFindAllWebParams,
} from '@/lib/types/wms-api'

// Defensive helpers (consistent with Products/Users/Dashboard)
function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.facilities)) return obj.facilities as T[]
    if (Array.isArray(obj.zones)) return obj.zones as T[]
    if (Array.isArray(obj.locations)) return obj.locations as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeArray(obj).length || fallback
  }
  return fallback
}

// ===== Types =====
export interface Facility {
  id: string
  facilityCode: string
  facilityName: string
  facilityType?: string
  isActive?: boolean
}

export interface Zone {
  id: string
  zoneCode: string
  zoneName: string
  zoneType?: string
  facilityId?: string | null
}

export interface Location {
  id: string
  locationCode: string
  locationName?: string
  locationType?: string
  zoneId?: string | null
  parentLocationId?: string | null
  capacity?: number
  isActive?: boolean
}

// ===== Facilities =====
export function useFacilities() {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'facilities'],
    queryFn: async () => {
      const res = await WarehouseFacilityController_findAllWeb()
      return res as unknown
    },
    select: (data) => ({
      facilities: safeArray<Facility>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

// ===== Zones =====
export function useZones(params: WarehouseZoneControllerFindAllWebParams = { facilityId: '' }) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'zones', params],
    queryFn: async () => {
      const res = await WarehouseZoneController_findAllWeb(params)
      return res as unknown
    },
    select: (data) => ({
      zones: safeArray<Zone>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

// ===== Locations =====
export function useLocations() {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'locations'],
    queryFn: async () => {
      const res = await StorageLocationController_findAllWeb()
      return res as unknown
    },
    select: (data) => ({
      locations: safeArray<Location>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLocationDto) => StorageLocationController_createWeb(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'locations'] })
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLocationDto }) =>
      StorageLocationController_updateWeb(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'locations'] })
    },
  })
}
