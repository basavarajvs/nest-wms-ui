import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CountWebController_list,
  CountWebController_schedule,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  ScheduleCountDto,
  CountWebControllerListParams,
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
