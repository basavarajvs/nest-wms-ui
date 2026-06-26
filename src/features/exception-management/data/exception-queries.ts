import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ExceptionManagementWebController_findAll,
  ExceptionManagementWebController_findById,
  ExceptionManagementWebController_create,
  ExceptionManagementWebController_update,
  ExceptionManagementWebController_delete,
  ExceptionManagementWebController_listComments,
  ExceptionManagementWebController_addComment,
  EscalationRuleController_findAll,
  EscalationRuleController_create,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateExceptionDto,
  UpdateExceptionDto,
  ExceptionManagementWebControllerFindAllParams,
  CreateCommentDto,
  CreateEscalationRuleDto,
  EscalationRuleControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.exceptions)) return obj.exceptions as T[]
    if (Array.isArray(obj.comments)) return obj.comments as T[]
    if (Array.isArray(obj.rules)) return obj.rules as T[]
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

export interface Exception {
  id: string
  exceptionType: string
  facilityId: string
  severity?: string
  referenceType?: string
  referenceId?: string
  productId?: string
  locationId?: string
  lotId?: string
  notes?: string
  assignedToUserId?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export function useExceptions(params?: ExceptionManagementWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'exceptions', 'list', stableKey],
    queryFn: async () => {
      const res = await ExceptionManagementWebController_findAll(params as ExceptionManagementWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      exceptions: safeArray<Exception>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useException(id: string) {
  return useQuery({
    queryKey: ['wms', 'exceptions', 'detail', id],
    queryFn: async () => {
      const res = await ExceptionManagementWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreateException() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateExceptionDto) => ExceptionManagementWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'exceptions'] })
    },
  })
}

export function useUpdateException() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateExceptionDto }) => ExceptionManagementWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'exceptions'] })
    },
  })
}

export function useDeleteException() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ExceptionManagementWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'exceptions'] })
    },
  })
}

export interface Comment {
  id: string
  body: string
  isInternal: boolean
  authorId?: string
  authorName?: string
  createdAt: string
}

export function useCommentList(exceptionId: string) {
  return useQuery({
    queryKey: ['wms', 'exceptions', 'comments', 'list', exceptionId],
    queryFn: async ({ queryKey }) => {
      const [, , , , id] = queryKey
      const res = await ExceptionManagementWebController_listComments(id)
      return res as unknown
    },
    select: (data) => ({ comments: safeArray<Comment>(data), total: safeTotal(data) }),
    enabled: !!exceptionId,
    staleTime: 1000 * 30,
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateCommentDto }) =>
      ExceptionManagementWebController_addComment(id, dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['wms', 'exceptions', 'comments', 'list', variables.id] })
    },
  })
}

export interface EscalationRule {
  id: string
  ruleName: string
  exceptionType: string
  facilityId: string
  severityMinimum: string
  unresolvedHours: number
  escalateToUserId: string
  isActive: boolean
  notifyViaEmail?: boolean
  createdAt?: string
  updatedAt?: string
}

export function useEscalationRuleList(params?: EscalationRuleControllerFindAllParams) {
  const qp = { facilityId: params?.facilityId || '' }
  return useQuery({
    queryKey: ['wms', 'escalation-rules', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , p] = queryKey
      const res = await EscalationRuleController_findAll(p as EscalationRuleControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({ rules: safeArray<EscalationRule>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 30,
  })
}

export function useCreateEscalationRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateEscalationRuleDto) => EscalationRuleController_create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'escalation-rules'] }),
  })
}
