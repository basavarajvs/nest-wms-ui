import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  WmsRuleController_list,
  WmsRuleController_create,
  WmsRuleController_get,
  WmsRuleController_update,
  WmsRuleController_evaluate,
  WmsRuleController_rollback,
} from '@/lib/api/wms-api/admin/admin'
import type { UpsertRuleDto } from '@/lib/types/wms-api/upsertRuleDto'
import type { EvaluateRuleDto } from '@/lib/types/wms-api/evaluateRuleDto'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.rules)) return obj.rules as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    const arr = safeArray(obj)
    if (arr.length) return arr.length
  }
  return fallback
}

export interface WmsRule {
  id?: string
  ruleKey: string
  name?: string
  description?: string
  ruleType: string
  status?: string
  version?: number
  definitionJson?: Record<string, unknown>
  lastEvaluatedAt?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export interface WmsRuleVersion {
  version: number
  ruleKey: string
  definitionJson?: Record<string, unknown>
  status?: string
  createdAt?: string
  createdBy?: string
}

export function useRules() {
  return useQuery({
    queryKey: ['wms', 'rules', 'list'],
    queryFn: async () => {
      const res = await WmsRuleController_list()
      return res as unknown
    },
    select: (data) => ({
      rules: safeArray<WmsRule>(data),
      total: safeTotal(data, safeArray<WmsRule>(data).length),
    }),
    staleTime: 1000 * 60 * 1,
  })
}

export function useRule(key: string | null) {
  return useQuery({
    queryKey: ['wms', 'rules', 'detail', key],
    queryFn: async () => {
      const res = await WmsRuleController_get(key!)
      return res as unknown
    },
    enabled: !!key,
    select: (data) => data as unknown as WmsRule | undefined,
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: UpsertRuleDto) => {
      const res = await WmsRuleController_create(dto)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'rules'] })
    },
  })
}

export function useUpdateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, dto }: { key: string; dto: UpsertRuleDto }) => {
      const res = await WmsRuleController_update(key, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      } as RequestInit)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'rules'] })
    },
  })
}

export function useEvaluateRule() {
  return useMutation({
    mutationFn: async ({
      key,
      dto,
    }: {
      key: string
      dto: EvaluateRuleDto
    }) => {
      const res = await WmsRuleController_evaluate(key, dto)
      return res as unknown
    },
  })
}

export function useRollbackRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      key,
      version,
    }: {
      key: string
      version: string
    }) => {
      const res = await WmsRuleController_rollback(key, version)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'rules'] })
    },
  })
}
