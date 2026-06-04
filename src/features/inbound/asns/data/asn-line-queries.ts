import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AsnLineWebController_findAll,
  AsnLineWebController_create,
  AsnLineWebController_update,
  AsnLineWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateAsnLineDto,
  UpdateAsnLineDto,
  AsnLineWebControllerFindAllParams,
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

export interface AsnLine {
  id: string
  asnId: string
  productId: string
  productName?: string
  productSku?: string
  expectedQuantity: number
  receivedQuantity?: number
  uomId: string
  lotNumber?: string
  expiryDate?: string
  notes?: string
  lineNumber?: number
  createdAt?: string
  updatedAt?: string
}

export function useAsnLines(asnId: string, params?: Omit<AsnLineWebControllerFindAllParams, 'asnId'>) {
  const stableKey = JSON.stringify({ asnId, ...params })
  return useQuery({
    queryKey: ['wms', 'inbound', 'asn', 'lines', stableKey],
    queryFn: async () => {
      const res = await AsnLineWebController_findAll({
        asnId,
        ...params,
      } as AsnLineWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      lines: safeArray<AsnLine>(data),
      total: safeTotal(data),
    }),
    enabled: !!asnId,
    staleTime: 1000 * 30,
  })
}

export function useCreateAsnLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAsnLineDto) => AsnLineWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'asn', 'lines'] })
    },
  })
}

export function useUpdateAsnLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAsnLineDto }) => AsnLineWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'asn', 'lines'] })
    },
  })
}

export function useDeleteAsnLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => AsnLineWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'asn', 'lines'] })
    },
  })
}
