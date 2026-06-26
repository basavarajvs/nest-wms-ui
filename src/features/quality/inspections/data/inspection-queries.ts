import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  QualityInspectionsWebController_create,
  QualityInspectionsWebController_findAll,
  QualityInspectionsWebController_findById,
  QualityInspectionsWebController_update,
  QualityInspectionsWebController_submitResult,
  QualityInspectionsWebController_getEvents,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateInspectionDto,
  UpdateInspectionDto,
  CreateInspectionResultDto,
  QualityInspectionsWebControllerFindAllParams,
} from '@/lib/types/wms-api'

export interface Inspection {
  id: string
  inspectionNumber?: string
  inspectionType: string
  status: string
  priority: string
  productId?: string
  productName?: string
  productSku?: string
  lotId?: string
  locationId?: string
  locationName?: string
  referenceType?: string
  referenceId?: string
  assignedToUserId?: string
  assignedToName?: string
  scheduledDate?: string
  completedAt?: string
  notes?: string
  facilityId: string
  createdAt: string
  updatedAt?: string
}

export interface InspectionResult {
  id: string
  inspectionId: string
  checkType: string
  result: string
  measuredValue?: number
  toleranceMin?: number
  toleranceMax?: number
  notes?: string
  mediaUrl?: string
  checkedBy?: string
  checkedAt?: string
}

export interface InspectionEvent {
  id: string
  inspectionId: string
  eventType: string
  performedBy?: string
  performedAt: string
  notes?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.events)) return obj.events as T[]
    if (Array.isArray(obj.inspections)) return obj.inspections as T[]
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

export function useInspectionList(params?: Partial<QualityInspectionsWebControllerFindAllParams>) {
  const qp: QualityInspectionsWebControllerFindAllParams = {
    status: params?.status || '',
    inspectionType: params?.inspectionType || '',
    facilityId: params?.facilityId || '',
  }
  const stableKey = JSON.stringify(qp)
  return useQuery({
    queryKey: ['wms', 'quality', 'inspections', 'list', stableKey],
    queryFn: async () => {
      const res = await QualityInspectionsWebController_findAll(qp)
      return res as unknown
    },
    select: (data) => ({
      inspections: safeArray<Inspection>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: ['wms', 'quality', 'inspections', 'detail', id],
    queryFn: async () => {
      const res = await QualityInspectionsWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useInspectionEvents(id: string) {
  return useQuery({
    queryKey: ['wms', 'quality', 'inspections', 'events', id],
    queryFn: async () => {
      const res = await QualityInspectionsWebController_getEvents(id)
      return res as unknown
    },
    select: (data) => safeArray<InspectionEvent>(data),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useCreateInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInspectionDto) => QualityInspectionsWebController_create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'quality', 'inspections'] })
    },
  })
}

export function useUpdateInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInspectionDto }) =>
      QualityInspectionsWebController_update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'quality', 'inspections'] })
    },
  })
}

export function useSubmitInspectionResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateInspectionResultDto }) =>
      QualityInspectionsWebController_submitResult(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'quality', 'inspections'] })
    },
  })
}
