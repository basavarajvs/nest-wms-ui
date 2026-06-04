import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  QualityWebController_listInspections,
  QualityWebController_getInspection,
  QualityWebController_createInspection,
  InboundWebController_startInspection,
  InboundWebController_completeInspection,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  QcInspectDto,
  CompleteInspectionDto,
  QualityWebControllerListInspectionsParams,
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
  params?: Partial<QualityWebControllerListInspectionsParams>
) {
  const queryParams: QualityWebControllerListInspectionsParams = {
    facilityId: params?.facilityId || '',
    grnLineId: params?.grnLineId || '',
    result: params?.result || '',
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  }
  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'quality', 'inspections', stableKey],
    queryFn: async () => {
      const res = await QualityWebController_listInspections(queryParams)
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
    queryKey: ['wms', 'quality', 'inspections', id],
    queryFn: async () => {
      const res = await QualityWebController_getInspection(id)
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
      queryClient.invalidateQueries({ queryKey: ['wms', 'quality', 'inspections'] })
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
      queryClient.invalidateQueries({ queryKey: ['wms', 'quality', 'inspections'] })
    },
  })
}

export function useInspectQc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: QcInspectDto) => {
      return QualityWebController_createInspection(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'quality', 'inspections'] })
    },
  })
}
