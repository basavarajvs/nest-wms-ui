import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HazmatWebController_registerHazmat,
  HazmatWebController_listHazmat,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateHazmatDto,
  HazmatWebControllerListHazmatParams,
} from '@/lib/types/wms-api'

export interface HazmatMaterial {
  id: string
  productId: string
  productName?: string
  productSku?: string
  hazardClass: string
  unNumber: string
  properShippingName: string
  packingGroup?: string
  division?: string
  flashPoint?: string
  storageGroup?: string
  msdsUrl?: string
  emergencyContact?: string
  emergencyPhone?: string
  facilityId: string
  isActive?: boolean
  createdAt: string
  updatedAt?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.materials)) return obj.materials as T[]
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

export function useHazmatList(params?: Partial<HazmatWebControllerListHazmatParams>) {
  const qp: HazmatWebControllerListHazmatParams = {
    facilityId: params?.facilityId || '',
    hazardClass: params?.hazardClass || '',
  }
  const stableKey = JSON.stringify(qp)
  return useQuery({
    queryKey: ['wms', 'hazmat', 'list', stableKey],
    queryFn: async () => {
      const res = await HazmatWebController_listHazmat(qp)
      return res as unknown
    },
    select: (data) => ({
      materials: safeArray<HazmatMaterial>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60,
  })
}

export function useRegisterHazmat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateHazmatDto) => HazmatWebController_registerHazmat(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'hazmat'] })
    },
  })
}
