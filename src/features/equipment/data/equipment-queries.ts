import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  EquipmentWebController_create,
  EquipmentWebController_list,
  EquipmentWebController_update,
  EquipmentWebController_changeStatus,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  ChangeEquipmentStatusDto,
  EquipmentWebControllerListParams,
} from '@/lib/types/wms-api'

export interface EquipmentItem {
  id: string
  equipmentCode: string
  equipmentName: string
  equipmentType: string
  facilityId: string
  status: string
  locationId?: string
  serialNumber?: string
  manufacturer?: string
  model?: string
  year?: number
  notes?: string
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
    if (Array.isArray(obj.equipment)) return obj.equipment as T[]
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

export function useEquipmentList(params?: Partial<EquipmentWebControllerListParams>) {
  const qp = { facilityId: params?.facilityId || '', equipmentType: params?.equipmentType || '', status: params?.status || '' }
  return useQuery({
    queryKey: ['wms', 'equipment', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , p] = queryKey
      const res = await EquipmentWebController_list(p as EquipmentWebControllerListParams)
      return res as unknown
    },
    select: (data) => ({ equipment: safeArray<EquipmentItem>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 30,
  })
}

export function useCreateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateEquipmentDto) => EquipmentWebController_create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'equipment'] }),
  })
}

export function useUpdateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateEquipmentDto }) => EquipmentWebController_update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'equipment'] }),
  })
}

export function useChangeEquipmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ChangeEquipmentStatusDto }) => EquipmentWebController_changeStatus(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'equipment'] }),
  })
}
