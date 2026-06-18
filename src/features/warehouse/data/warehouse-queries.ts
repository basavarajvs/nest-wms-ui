import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  WarehouseFacilityController_findAllWeb,
  WarehouseFacilityController_findById,
  WarehouseFacilityController_create,
  WarehouseFacilityController_update,
  WarehouseFacilityController_delete,
  WarehouseFacilityController_generateLocations,
  WarehouseZoneController_findAllWeb,
  WarehouseZoneController_findById,
  WarehouseZoneController_create,
  WarehouseZoneController_update,
  WarehouseZoneController_delete,
  StorageLocationController_findAllWeb,
  StorageLocationController_createWeb,
  StorageLocationController_updateWeb,
  StorageLocationController_getChildrenWeb,
  StorageLocationController_findByCodeWeb,
} from '@/lib/api/wms-api/master-data/master-data'
import {
  AisleController_list,
  AisleController_create,
  AisleController_update,
  AisleController_delete,
  BayController_list,
  BayController_create,
  BayController_update,
  BayController_delete,
  RackController_list,
  RackController_create,
  RackController_update,
  RackController_delete,
  LevelController_list,
  LevelController_create,
  LevelController_update,
  LevelController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateFacilityDto,
  UpdateFacilityDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreateLocationDto,
  UpdateLocationDto,
  StorageLocationControllerFindByCodeWebParams,
  AisleControllerListParams,
  BayControllerListParams,
  RackControllerListParams,
  LevelControllerListParams,
  CreateAisleDto,
  UpdateAisleDto,
  CreateBayDto,
  UpdateBayDto,
  CreateRackDto,
  UpdateRackDto,
  CreateLevelDto,
  UpdateLevelDto,
} from '@/lib/types/wms-api'
import type { GenerateLocationsDto } from '@/lib/types/wms-api/generateLocationsDto'
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
    if (Array.isArray(obj.aisles)) return obj.aisles as T[]
    if (Array.isArray(obj.bays)) return obj.bays as T[]
    if (Array.isArray(obj.racks)) return obj.racks as T[]
    if (Array.isArray(obj.levels)) return obj.levels as T[]
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
      let facilities = safeArray<Record<string, unknown>>(data).map(
        (item): Facility => ({
          id: (item.id as string) ?? '',
          facilityCode: (item.facilityCode as string) ?? '',
          facilityName: (item.name as string) ?? (item.facilityName as string) ?? '',
          facilityType: item.facilityType as string | undefined,
          isActive: item.isActive as boolean | undefined,
        })
      )
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

export function useCreateFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateFacilityDto) =>
      WarehouseFacilityController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'facilities'] })
    },
  })
}

export function useUpdateFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFacilityDto }) =>
      WarehouseFacilityController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'facilities'] })
    },
  })
}

export function useDeleteFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      WarehouseFacilityController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'facilities'] })
    },
  })
}

export function useCreateZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateZoneDto) =>
      WarehouseZoneController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'zones'] })
    },
  })
}

export function useUpdateZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateZoneDto }) =>
      WarehouseZoneController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'zones'] })
    },
  })
}

export function useDeleteZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      WarehouseZoneController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'zones'] })
    },
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

export function useGenerateLocations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ facilityId, dto }: { facilityId: string; dto: GenerateLocationsDto }) =>
      WarehouseFacilityController_generateLocations(facilityId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'locations'] })
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'zones'] })
    },
  })
}

export interface Aisle {
  id: string
  code: string
  zoneId: string
  zoneName?: string
  isActive?: boolean
}

export interface Bay {
  id: string
  code: string
  aisleId: string
  aisleCode?: string
  isActive?: boolean
}

export interface Rack {
  id: string
  code: string
  bayId: string
  bayCode?: string
  isActive?: boolean
}

export interface Level {
  id: string
  code: string
  rackId: string
  rackCode?: string
  locationPrefix?: string
  locationsPerLevel?: number
  isActive?: boolean
}

export function useAisles(params: AisleControllerListParams) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'aisles', params],
    queryFn: async () => {
      const res = await AisleController_list(params)
      return res as unknown
    },
    select: (data) => ({
      aisles: safeArray<Aisle>(data),
      total: safeTotal(data),
    }),
    enabled: !!params.zoneId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useBays(params: BayControllerListParams) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'bays', params],
    queryFn: async () => {
      const res = await BayController_list(params)
      return res as unknown
    },
    select: (data) => ({
      bays: safeArray<Bay>(data),
      total: safeTotal(data),
    }),
    enabled: !!params.aisleId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useRacks(params: RackControllerListParams) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'racks', params],
    queryFn: async () => {
      const res = await RackController_list(params)
      return res as unknown
    },
    select: (data) => ({
      racks: safeArray<Rack>(data),
      total: safeTotal(data),
    }),
    enabled: !!params.bayId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useLevels(params: LevelControllerListParams) {
  return useQuery({
    queryKey: ['wms', 'warehouse', 'levels', params],
    queryFn: async () => {
      const res = await LevelController_list(params)
      return res as unknown
    },
    select: (data) => ({
      levels: safeArray<Level>(data),
      total: safeTotal(data),
    }),
    enabled: !!params.rackId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateAisle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAisleDto) =>
      AisleController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'aisles'] })
    },
  })
}

export function useUpdateAisle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAisleDto }) =>
      AisleController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'aisles'] })
    },
  })
}

export function useDeleteAisle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      AisleController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'aisles'] })
    },
  })
}

export function useCreateBay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBayDto) =>
      BayController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'bays'] })
    },
  })
}

export function useUpdateBay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBayDto }) =>
      BayController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'bays'] })
    },
  })
}

export function useDeleteBay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      BayController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'bays'] })
    },
  })
}

export function useCreateRack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRackDto) =>
      RackController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'racks'] })
    },
  })
}

export function useUpdateRack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRackDto }) =>
      RackController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'racks'] })
    },
  })
}

export function useDeleteRack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      RackController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'racks'] })
    },
  })
}

export function useCreateLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLevelDto) =>
      LevelController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'levels'] })
    },
  })
}

export function useUpdateLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLevelDto }) =>
      LevelController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'levels'] })
    },
  })
}

export function useDeleteLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      LevelController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'warehouse', 'levels'] })
    },
  })
}
