import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CountWebController_list,
  CountWebController_schedule,
  CountWebController_batchSubmit,
  CountWebController_summary,
  CountWebController_getLines,
  CountWebController_finalize,
  CountLineWebController_update,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  ScheduleCountDto,
  CountWebControllerListParams,
  CountWebControllerSummaryParams,
  BatchSubmitLinesDto,
  UpdateCycleCountLineDto,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.counts)) return obj.counts as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    if (typeof obj.itemsCount === 'number') return obj.itemsCount
    return safeList<unknown>(obj).length
  }
  return 0
}

export interface CycleCount {
  id: string
  countNumber?: string
  countMethod?: string
  status?: string
  facilityId?: string
  scopeType?: string
  scopeIdentifier?: string
  frequencyType?: string
  assignedUserId?: string
  totalItems?: number
  countedItems?: number
  varianceCount?: number
  autoAdjust?: boolean
  scheduledAt?: string
  completedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface CycleCountListParams {
  page?: number
  limit?: number
  status?: string
  facilityId?: string
  scopeType?: string
}

export function useCycleCounts(params?: CycleCountListParams) {
  const queryParams: CountWebControllerListParams = {
    status: params?.status || '',
    facilityId: params?.facilityId || '',
  }
  const listParams = {
    ...queryParams,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    scopeType: params?.scopeType ?? '',
  }

  return useQuery({
    queryKey: ['wms', 'cycle-counts', listParams],
    queryFn: async () => {
      const res = await CountWebController_list(listParams)
      return res as unknown
    },
    select: (data) => ({
      counts: safeList<CycleCount>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useScheduleCount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: ScheduleCountDto) => {
      return CountWebController_schedule(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'cycle-counts'] })
    },
  })
}

export function useSubmitCountLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: BatchSubmitLinesDto) => {
      return CountWebController_batchSubmit(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'cycle-counts'] })
    },
  })
}

export interface CountSummary {
  totalCounts?: number
  completedCounts?: number
  pendingCounts?: number
  inProgressCounts?: number
  varianceCount?: number
  totalItems?: number
  countedItems?: number
}

export function useCountSummary(params: CountWebControllerSummaryParams) {
  return useQuery({
    queryKey: ['wms', 'cycle-counts', 'summary', params],
    queryFn: async () => {
      const res = await CountWebController_summary(params)
      return res as unknown
    },
    select: (data) => {
      if (data && typeof data === 'object') {
        return data as CountSummary
      }
      return {} as CountSummary
    },
    staleTime: 1000 * 60,
  })
}

export interface CycleCountLine {
  id: string
  countId?: string
  lineNumber?: number
  locationId?: string
  locationName?: string
  productId?: string
  productSku?: string
  productName?: string
  lotId?: string
  systemQuantity?: number
  countedQuantity?: number
  variance?: number
  uomId?: string
  status?: string
}

export function useCountLines(countId: string) {
  return useQuery({
    queryKey: ['wms', 'cycle-counts', 'lines', countId],
    queryFn: async () => {
      const res = await CountWebController_getLines(countId)
      return res as unknown
    },
    select: (data) => ({
      lines: safeList<CycleCountLine>(data),
    }),
    enabled: !!countId,
    staleTime: 1000 * 15,
  })
}

export function useUpdateCountLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCycleCountLineDto }) => {
      return CountLineWebController_update(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'cycle-counts'] })
    },
  })
}

export function useFinalizeCount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return CountWebController_finalize(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'cycle-counts'] })
    },
  })
}

export const useCompleteCount = useFinalizeCount
