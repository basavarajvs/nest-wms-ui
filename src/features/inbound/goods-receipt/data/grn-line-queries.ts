import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GrnLineWebController_findAll,
  GrnLineWebController_create,
  GrnLineWebController_update,
  GrnLineWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateGrnLineDto,
  UpdateGrnLineDto,
  GrnLineWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.lines)) return obj.lines as T[]
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

export interface GrnLine {
  id: string
  grnId: string
  productId: string
  productName?: string
  productSku?: string
  expectedQuantity: number
  receivedQuantity?: number
  damagedQuantity?: number
  uomId: string
  lotNumber?: string
  expiryDate?: string
  notes?: string
  lineNumber?: number
  createdAt?: string
  updatedAt?: string
}

export function useGrnLines(grnId: string, params?: Omit<GrnLineWebControllerFindAllParams, 'grnId'>) {
  const stableKey = JSON.stringify({ grnId, ...params })
  return useQuery({
    queryKey: ['wms', 'inbound', 'grn', 'lines', stableKey],
    queryFn: async () => {
      const res = await GrnLineWebController_findAll({
        grnId,
        ...params,
      } as GrnLineWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      lines: safeArray<GrnLine>(data),
      total: safeTotal(data),
    }),
    enabled: !!grnId,
    staleTime: 1000 * 30,
  })
}

export function useCreateGrnLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateGrnLineDto) => GrnLineWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn', 'lines'] })
    },
  })
}

export function useUpdateGrnLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGrnLineDto }) =>
      GrnLineWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn', 'lines'] })
    },
  })
}

export function useDeleteGrnLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => GrnLineWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn', 'lines'] })
    },
  })
}
