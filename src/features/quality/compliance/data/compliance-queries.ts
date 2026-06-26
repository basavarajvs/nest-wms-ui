import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ComplianceWebController_createRequirement,
  ComplianceWebController_listRequirements,
  ComplianceWebController_createAudit,
  ComplianceWebController_updateAudit,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateRequirementDto,
  CreateAuditDto,
  UpdateAuditDto,
  ComplianceWebControllerListRequirementsParams,
} from '@/lib/types/wms-api'

export interface ComplianceRequirement {
  id: string
  requirementCode: string
  complianceType: string
  description: string
  applicableEntity?: string
  frequencyType?: string
  facilityId: string
  isActive?: boolean
  createdAt: string
  updatedAt?: string
}

export interface ComplianceAudit {
  id: string
  auditNumber?: string
  requirementId: string
  requirementCode?: string
  status: string
  result?: string
  auditedByUserId?: string
  auditedByName?: string
  scheduledDate?: string
  completedAt?: string
  findings?: Record<string, unknown>
  correctiveActions?: Record<string, unknown>
  facilityId: string
  createdAt: string
  updatedAt?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.requirements)) return obj.requirements as T[]
    if (Array.isArray(obj.audits)) return obj.audits as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    return safeArray(data).length
  }
  return 0
}

export function useRequirementList(params?: Partial<ComplianceWebControllerListRequirementsParams>) {
  const qp: ComplianceWebControllerListRequirementsParams = {
    facilityId: params?.facilityId || '',
    complianceType: params?.complianceType || '',
  }
  const stableKey = JSON.stringify(qp)
  return useQuery({
    queryKey: ['wms', 'compliance', 'requirements', stableKey],
    queryFn: async () => {
      const res = await ComplianceWebController_listRequirements(qp)
      return res as unknown
    },
    select: (data) => ({
      requirements: safeArray<ComplianceRequirement>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60,
  })
}

export function useCreateRequirement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRequirementDto) => ComplianceWebController_createRequirement(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'compliance', 'requirements'] })
    },
  })
}

export function useCreateAudit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAuditDto) => ComplianceWebController_createAudit(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'compliance', 'audits'] })
    },
  })
}

export function useUpdateAudit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAuditDto }) =>
      ComplianceWebController_updateAudit(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'compliance', 'audits'] })
    },
  })
}
