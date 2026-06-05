import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ReplenishmentWebController_getSuggestions,
  ReplenishmentWebController_listTasks,
  ReplenishmentWebController_createTask,
  ReplenishmentWebController_completeTask,
  ReplenishmentWebController_cancelTask,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  ReplenishmentWebControllerGetSuggestionsParams,
  ReplenishmentWebControllerListTasksParams,
  CreateReplenishmentTaskDto,
  CompleteReplenishmentTaskDto,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.suggestions)) return obj.suggestions as T[]
    if (Array.isArray(obj.tasks)) return obj.tasks as T[]
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

export interface ReplenishmentSuggestion {
  id: string
  productId: string
  productName?: string
  productSku?: string
  pickLocationId: string
  pickLocationName?: string
  currentQty: number
  minQty: number
  maxQty: number
  suggestedQty: number
  bulkLocationId: string
  bulkLocationName?: string
  priority?: string
  status?: string
  createdAt?: string
}

export interface ReplenishmentTask {
  id: string
  productId: string
  productName?: string
  productSku?: string
  fromLocationId: string
  fromLocationName?: string
  toLocationId: string
  toLocationName?: string
  requestedQuantity: number
  fulfilledQuantity?: number
  status: string
  priority?: string
  notes?: string
  createdAt?: string
  completedAt?: string
}

export function useReplenishmentSuggestions(facilityId: string) {
  return useQuery({
    queryKey: ['wms', 'replenishment', 'suggestions', facilityId],
    queryFn: async () => {
      const params: ReplenishmentWebControllerGetSuggestionsParams = { facilityId }
      const res = await ReplenishmentWebController_getSuggestions(params)
      return res as unknown
    },
    select: (data) => ({
      suggestions: safeArray<ReplenishmentSuggestion>(data),
      total: safeTotal(data),
    }),
    enabled: !!facilityId,
    staleTime: 1000 * 30,
  })
}

export function useReplenishmentTasks(params?: ReplenishmentWebControllerListTasksParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'replenishment', 'tasks', stableKey],
    queryFn: async () => {
      const res = await ReplenishmentWebController_listTasks(params)
      return res as unknown
    },
    select: (data) => ({
      tasks: safeArray<ReplenishmentTask>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateReplenishmentTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateReplenishmentTaskDto) => {
      return ReplenishmentWebController_createTask(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'replenishment'] })
    },
  })
}

export function useCancelReplenishmentTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return ReplenishmentWebController_cancelTask(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'replenishment'] })
    },
  })
}

export function useCompleteReplenishmentTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: CompleteReplenishmentTaskDto }) => {
      return ReplenishmentWebController_completeTask(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'replenishment'] })
    },
  })
}
