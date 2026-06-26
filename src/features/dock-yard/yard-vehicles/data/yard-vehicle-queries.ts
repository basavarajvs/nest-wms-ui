import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  YardVehicleWebController_register,
  YardVehicleWebController_list,
  YardVehicleWebController_assignDock,
  YardVehicleWebController_depart,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  RegisterVehicleDto,
  AssignDockDto,
  YardVehicleWebControllerListParams,
} from '@/lib/types/wms-api'

export interface YardVehicle {
  id: string
  vehiclePlate: string
  vehicleType: string
  facilityId: string
  status: string
  carrierCode?: string
  driverName?: string
  driverPhone?: string
  sealNumber?: string
  yardLocation?: string
  dockId?: string
  dockName?: string
  assignedAt?: string
  arrivedAt?: string
  departedAt?: string
  createdAt: string
  updatedAt?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.vehicles)) return obj.vehicles as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    return safeArray(data).length
  }
  return 0
}

export function useVehicleList(params?: Partial<YardVehicleWebControllerListParams>) {
  const qp = { facilityId: params?.facilityId || '', status: params?.status || '' }
  return useQuery({
    queryKey: ['wms', 'yard', 'vehicles', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await YardVehicleWebController_list(p as YardVehicleWebControllerListParams)
      return res as unknown
    },
    select: (data) => ({ vehicles: safeArray<YardVehicle>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useRegisterVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: RegisterVehicleDto) => YardVehicleWebController_register(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'yard', 'vehicles'] }),
  })
}

export function useAssignDock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AssignDockDto }) =>
      YardVehicleWebController_assignDock(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'yard', 'vehicles'] }),
  })
}

export function useDepartVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => YardVehicleWebController_depart(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'yard', 'vehicles'] }),
  })
}
