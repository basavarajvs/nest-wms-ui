import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  EquipmentWebController_createMaintenance,
  EquipmentWebController_listMaintenance,
  EquipmentWebController_completeMaintenance,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateMaintenanceDto,
  CompleteMaintenanceDto,
  EquipmentWebControllerListMaintenanceParams,
} from '@/lib/types/wms-api'

export interface MaintenanceRecord {
  id: string
  equipmentId: string
  equipmentName?: string
  equipmentCode?: string
  maintenanceType: string
  priority?: string
  status: string
  description?: string
  notes?: string
  cost?: number
  downtimeMinutes?: number
  performedByUserId?: string
  completedAt?: string
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
    if (Array.isArray(obj.records)) return obj.records as T[]
    if (Array.isArray(obj.maintenance)) return obj.maintenance as T[]
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

export function useMaintenanceList(params?: Partial<EquipmentWebControllerListMaintenanceParams>) {
  const qp = { facilityId: params?.facilityId || '', equipmentId: params?.equipmentId || '', status: params?.status || '' }
  return useQuery({
    queryKey: ['wms', 'equipment', 'maintenance', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await EquipmentWebController_listMaintenance(p as EquipmentWebControllerListMaintenanceParams)
      return res as unknown
    },
    select: (data) => ({ records: safeArray<MaintenanceRecord>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 30,
  })
}

export function useCreateMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateMaintenanceDto }) =>
      EquipmentWebController_createMaintenance(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'equipment'] }),
  })
}

export function useCompleteMaintenance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CompleteMaintenanceDto }) =>
      EquipmentWebController_completeMaintenance(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'equipment'] }),
  })
}
