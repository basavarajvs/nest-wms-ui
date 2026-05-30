import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InventoryWebController_listAdjustments,
  InventoryWebController_submitAdjustment,
  InventoryWebController_approveAdjustment,
  InventoryWebController_createAdjustment,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  InventoryWebControllerListAdjustmentsParams,
  CreateAdjustmentDto,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.adjustments)) return obj.adjustments as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeList(obj).length || fallback
  }
  return fallback
}

export interface Adjustment {
  id: string
  reference?: string
  facilityId?: string
  reasonCode?: string
  reason?: string
  notes?: string
  status?: string
  createdAt?: string
  submittedAt?: string
  approvedAt?: string
}

export function useAdjustments(
  params: Partial<InventoryWebControllerListAdjustmentsParams> = {}
) {
  const queryParams: InventoryWebControllerListAdjustmentsParams = {
    status: params.status || '',
    facilityId: params.facilityId || '',
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  }

  return useQuery({
    queryKey: ['wms', 'inventory', 'adjustments', queryParams],
    queryFn: async () => {
      const res = await InventoryWebController_listAdjustments(
        queryParams
      )
      return res as unknown
    },
    select: (data) => ({
      adjustments: safeList<Adjustment>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateAdjustmentDto) =>
      InventoryWebController_createAdjustment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wms', 'inventory', 'adjustments'],
      })
    },
  })
}

export function useSubmitAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      InventoryWebController_submitAdjustment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wms', 'inventory', 'adjustments'],
      })
    },
  })
}

export function useApproveAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      InventoryWebController_approveAdjustment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wms', 'inventory', 'adjustments'],
      })
    },
  })
}
