import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InboundWebController_listGrns,
  InboundWebController_createGrnFromAsn,
  InboundWebController_createGrnAdHoc,
  InboundWebController_getGrnProgress,
  InboundWebController_markArrived,
  InboundWebController_startReceiving,
  InboundWebController_markReceived,
  InboundWebController_startInspection,
  InboundWebController_completeInspection,
  InboundWebController_cancelGrn,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateGrnFromAsnDto,
  CreateGrnAdHocDto,
  MarkGrnArrivedDto,
  CompleteInspectionDto,
  InboundWebControllerListGrnsParams,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.grns)) return obj.grns as T[]
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

export interface Grn {
  id: string
  receiptNumber?: string
  status?: string
  facilityId?: string
  asnId?: string
  asnNumber?: string
  poNumber?: string
  supplier?: string
  receivedDate?: string
  createdAt?: string
  updatedAt?: string
}

export function useGrns(params?: InboundWebControllerListGrnsParams) {
  const stableKey = JSON.stringify(params ?? {})
  return useQuery({
    queryKey: ['wms', 'inbound', 'grn', stableKey],
    queryFn: async () => {
      const res = await InboundWebController_listGrns(params)
      return res as unknown
    },
    select: (data) => ({
      grns: safeList<Grn>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateGrnFromAsn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateGrnFromAsnDto) => {
      return InboundWebController_createGrnFromAsn(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useCreateGrnAdHoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateGrnAdHocDto) => {
      return InboundWebController_createGrnAdHoc(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useGrnProgress(id: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['wms', 'inbound', 'grn', 'progress', id],
    queryFn: async () => {
      const res = await InboundWebController_getGrnProgress(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 30,
    retry: 1,
    refetchInterval: options?.refetchInterval,
  })
}

export const useGetGrnProgress = useGrnProgress

// GRN status transition mutations
export function useMarkGrnArrived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { receiptNumber: string; dto: MarkGrnArrivedDto }) => {
      return InboundWebController_markArrived(params.receiptNumber, params.dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useStartReceiving() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_startReceiving(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useMarkGrnReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_markReceived(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useStartInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_startInspection(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useCompleteInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { receiptNumber: string; dto: CompleteInspectionDto }) => {
      return InboundWebController_completeInspection(args.receiptNumber, args.dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useCancelGrn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_cancelGrn(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}
