import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  WarehouseFacilityController_findAllWeb,
  WarehouseZoneController_findAllWeb,
  StorageLocationController_findAllWeb,
  StorageLocationController_createWeb,
  StorageLocationController_updateWeb,
  StorageLocationController_getChildrenWeb,
  StorageLocationController_findByCodeWeb,
} from '@/lib/api/wms-api/master-data/master-data'
import type {
  CreateLocationDto,
  UpdateLocationDto,
  StorageLocationControllerFindByCodeWebParams,
} from '@/lib/types/wms-api'
import { useFacility } from '@/hooks/useFacility'

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
    return safeArray(data).length || fallback
  }
  return fallback
}

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

export function useFacilities(search?: string) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'facilities', search],
    queryFn: async () => {
      const res = await WarehouseFacilityController_findAllWeb()
      return res as unknown
    },
    select: (data) => {
      let facilities = safeArray<Facility>(data)
      if (search) {
        const q = search.toLowerCase()
        facilities = facilities.filter(
          (f) =>
            f.facilityCode.toLowerCase().includes(q) ||
            f.facilityName.toLowerCase().includes(q)
        )
      }
      return { facilities, total: facilities.length }
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useZones(facilityIdOverride?: string) {
  const { selectedFacility } = useFacility()
  const facilityId = facilityIdOverride ?? selectedFacility?.id ?? ''

  return useQuery({
    queryKey: ['wms', 'warehouse', 'zones', { facilityId }],
    queryFn: async () => {
      const res = await WarehouseZoneController_findAllWeb({ facilityId })
      return res as unknown
    },
    select: (data) => ({
      zones: safeArray<Zone>(data),
      total: safeTotal(data),
    }),
    enabled: !!facilityId,
    staleTime: 1000 * 60 * 2,
  })
}

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

export function useLocationChildren(parentId: string | null) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'locations', 'children', parentId],
    queryFn: async () => {
      const res = await StorageLocationController_getChildrenWeb(parentId!)
      return res as unknown
    },
    select: (data) => ({
      locations: safeArray<Location>(data),
      total: safeTotal(data),
    }),
    enabled: !!parentId,
    staleTime: 1000 * 60,
  })
}

export function useFindLocationByCode(
  code: string,
  params: StorageLocationControllerFindByCodeWebParams
) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'locations', 'by-code', code, params],
    queryFn: async () => {
      const res = await StorageLocationController_findByCodeWeb(code, params)
      return res as unknown
    },
    enabled: !!code,
    staleTime: 1000 * 30,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLocationDto) =>
      StorageLocationController_createWeb(dto),
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
