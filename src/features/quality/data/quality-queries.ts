import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  QualityInspectionsWebController_findAll,
  QualityInspectionsWebController_findById,
  QualityInspectionsWebController_create,
  InboundWebController_startInspection,
  InboundWebController_completeInspection,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CompleteInspectionDto,
  QualityInspectionsWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.inspections)) return obj.inspections as T[]
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

export interface QualityInspection {
  id: string
  grnLineId?: string
  grnId?: string
  grnLineNumber?: number
  productName?: string
  productSku?: string
  qcResult?: string
  status?: string
  notes?: string
  sampleSize?: number
  passCount?: number
  failCount?: number
  defectTypes?: string[]
  inspectorName?: string
  inspectedAt?: string
  createdAt?: string
  photoUrls?: string[]
}

export function useQualityInspections(
  params?: Partial<QualityInspectionsWebControllerFindAllParams>
) {
  const queryParams: QualityInspectionsWebControllerFindAllParams = {
    facilityId: params?.facilityId || '',
    status: params?.status || '',
    inspectionType: params?.inspectionType || '',
  }
  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'quality', 'old-inspections', stableKey],
    queryFn: async () => {
      const res = await QualityInspectionsWebController_findAll(queryParams)
      return res as unknown
    },
    select: (data) => ({
      inspections: safeArray<QualityInspection>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useQualityInspection(id: string) {
  return useQuery({
    queryKey: ['wms', 'quality', 'old-inspections', id],
    queryFn: async () => {
      const res = await QualityInspectionsWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<QualityInspection>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useStartInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_startInspection(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
      queryClient.invalidateQueries({ queryKey: ['wms', 'quality', 'old-inspections'] })
    },
  })
}

export function useCompleteInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { receiptNumber: string; dto: CompleteInspectionDto }) => {
      return InboundWebController_completeInspection(args.receiptNumber, args.dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
      queryClient.invalidateQueries({ queryKey: ['wms', 'quality', 'old-inspections'] })
    },
  })
}

export function useInspectQc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: any) => {
      return QualityInspectionsWebController_create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'quality', 'old-inspections'] })
    },
  })
}
