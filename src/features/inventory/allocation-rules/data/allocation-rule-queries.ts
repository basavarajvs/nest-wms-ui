import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AllocationRulesWebController_findAll,
  AllocationRulesWebController_findById,
  AllocationRulesWebController_create,
  AllocationRulesWebController_update,
  AllocationRulesWebController_delete,
  AllocationRulesWebController_addConstraint,
  AllocationRulesWebController_removeConstraint,
  AllocationRulesWebController_addLocation,
  AllocationRulesWebController_removeLocation,
  AllocationRulesWebController_evaluate,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateAllocationRuleDto,
  UpdateAllocationRuleDto,
  CreateConstraintDto,
  CreateRuleLocationDto,
  EvaluateRulesDto,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
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
    return safeList(obj).length || fallback
  }
  return fallback
}

export interface AllocationRule {
  id: string
  ruleName?: string
  ruleType?: string
  priority?: number
  isActive?: boolean
  facilityId?: string
  description?: string
  effectiveDate?: string
  expiryDate?: string
  createdAt?: string
  constraints?: AllocationRuleConstraint[]
  locationOverrides?: AllocationRuleLocation[]
}

export interface AllocationRuleConstraint {
  id?: string
  constraintField?: string
  constraintOperator?: string
  constraintValue?: string
}

export interface AllocationRuleLocation {
  id?: string
  locationRecId?: string
  locationId?: string
  priority?: number
}

interface AllocationRuleQueryParams {
  facilityId?: string
  isActive?: string
}

export function useAllocationRuleList(params: AllocationRuleQueryParams = {}) {
  const stableKey = JSON.stringify(params)

  return useQuery({
    queryKey: ['wms', 'inventory', 'allocation-rules', stableKey],
    queryFn: async () => {
      const res = await AllocationRulesWebController_findAll(params)
      return res as unknown
    },
    select: (data) => ({
      rules: safeList<AllocationRule>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useAllocationRule(id: string | undefined) {
  return useQuery({
    queryKey: ['wms', 'inventory', 'allocation-rules', id],
    queryFn: async () => {
      const res = await AllocationRulesWebController_findById(id!)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreateAllocationRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateAllocationRuleDto) => {
      return AllocationRulesWebController_create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useUpdateAllocationRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateAllocationRuleDto }) => {
      return AllocationRulesWebController_update(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useDeleteAllocationRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return AllocationRulesWebController_delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useAddConstraint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: CreateConstraintDto }) => {
      return AllocationRulesWebController_addConstraint(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useRemoveConstraint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, constraintId }: { id: string; constraintId: string }) => {
      return AllocationRulesWebController_removeConstraint(id, constraintId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useAddRuleLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: CreateRuleLocationDto }) => {
      return AllocationRulesWebController_addLocation(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useRemoveRuleLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, locationRecId }: { id: string; locationRecId: string }) => {
      return AllocationRulesWebController_removeLocation(id, locationRecId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'allocation-rules'] })
    },
  })
}

export function useEvaluateRules() {
  return useMutation({
    mutationFn: async (dto: EvaluateRulesDto) => {
      const res = await AllocationRulesWebController_evaluate(dto)
      return res as unknown
    },
  })
}
