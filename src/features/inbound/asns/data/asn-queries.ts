import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InboundWebController_listAsns,
  InboundWebController_createAsn,
  InboundWebController_previewAsn,
  InboundWebController_updateAsnStatus,
  InboundWebController_getAsnDetail,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateAsnDto, UpdateAsnStatusDto, InboundWebControllerListAsnsParams } from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.asns)) return obj.asns as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeList(data).length || fallback
  }
  return fallback
}

export interface Asn {
  id: string
  asnNumber?: string
  status?: string
  facilityId?: string
  supplier?: string
  poNumber?: string
  expectedDate?: string
  createdAt?: string
  updatedAt?: string
}

export function useAsns(params?: InboundWebControllerListAsnsParams) {
  const stableKey = JSON.stringify(params ?? {})
  return useQuery({
    queryKey: ['wms', 'inbound', 'asn', stableKey],
    queryFn: async () => {
      const res = await InboundWebController_listAsns(params)
      return res as unknown
    },
    select: (data) => ({
      asns: safeList<Asn>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}


export function useCreateAsn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateAsnDto) => {
      return InboundWebController_createAsn(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'asn'] })
    },
  })
}

export function usePreviewAsn() {
  return useMutation({
    mutationFn: async (id: string) => {
      return InboundWebController_previewAsn(id)
    },
  })
}

export interface StatusHistoryEntry {
  from?: string
  to?: string
  changedAt?: string
  changedBy?: string
}

export interface AsnDetail extends Asn {
  carrierName?: string
  trackingNumber?: string
  createdBy?: string
  facilityName?: string
  vendorName?: string
  notes?: string
  lines?: Array<{
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
  }>
  statusHistory?: StatusHistoryEntry[]
}

export function useAsnDetail(id: string) {
  return useQuery({
    queryKey: ['wms', 'inbound', 'asn', 'detail', id],
    queryFn: async () => {
      const res = await InboundWebController_getAsnDetail(id)
      return res as unknown
    },
    select: (data) => data as unknown as AsnDetail,
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useUpdateAsnStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string
      dto: UpdateAsnStatusDto
    }) => {
      return InboundWebController_updateAsnStatus(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'asn'] })
    },
  })
}
