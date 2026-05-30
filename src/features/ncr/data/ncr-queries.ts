import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  NonConformanceReportsWebController_findAll,
  NonConformanceReportsWebController_findById,
  NonConformanceReportsWebController_create,
  NonConformanceReportsWebController_update,
  NonConformanceReportsWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateNcrDto,
  UpdateNcrDto,
  NonConformanceReportsWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.nonConformanceReports)) return obj.nonConformanceReports as T[]
    if (Array.isArray(obj.ncrs)) return obj.ncrs as T[]
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

export interface Ncr {
  id: string
  ncrName?: string
  facilityId: string
  description?: string
  severity?: string
  referenceType?: string
  referenceId?: string
  productId?: string
  lotId?: string
  notes?: string
  assignedToUserId?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export function useNcrs(params?: NonConformanceReportsWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'ncrs', 'list', stableKey],
    queryFn: async () => {
      const res = await NonConformanceReportsWebController_findAll(params as NonConformanceReportsWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      ncrs: safeArray<Ncr>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useNcr(id: string) {
  return useQuery({
    queryKey: ['wms', 'ncrs', 'detail', id],
    queryFn: async () => {
      const res = await NonConformanceReportsWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreateNcr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateNcrDto) => NonConformanceReportsWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'ncrs'] })
    },
  })
}

export function useUpdateNcr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateNcrDto }) => NonConformanceReportsWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'ncrs'] })
    },
  })
}

export function useDeleteNcr() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => NonConformanceReportsWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'ncrs'] })
    },
  })
}
