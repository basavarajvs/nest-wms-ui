import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { InventoryWebController_upsertPolicy } from '@/lib/api/wms-api/wms-web/wms-web'
import type { UpsertPolicyDto } from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.policies)) return obj.policies as T[]
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

export interface Policy {
  id: string
  facilityId?: string
  productId?: string
  productSku?: string
  policyType?: string
  reorderPoint?: number
  safetyStock?: number
  maxStock?: number
  enabled?: boolean
  notes?: string
  createdAt?: string
}

export function usePolicies() {
  return useQuery({
    queryKey: ['wms', 'inventory', 'policies'],
    queryFn: async () => {
      return { items: [], total: 0, message: 'No list endpoint available' } as unknown
    },
    select: (data) => ({
      policies: safeList<Policy>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60,
  })
}

export interface PolicyFormValues extends UpsertPolicyDto {
  reorderPoint?: number
  safetyStock?: number
  maxLevel?: number
  minOrderQty?: number
}

export function useUpsertPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: UpsertPolicyDto) => {
      return InventoryWebController_upsertPolicy(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wms', 'inventory', 'policies'],
      })
    },
  })
}

export { useUpsertPolicy as useCreatePolicy }
