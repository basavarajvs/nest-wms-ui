import { useQuery } from '@tanstack/react-query'
import {
  ReceivingController_findAll,
  ReceivingController_findById,
} from '@/lib/wms-api/api/wms-api/goods-receipt/goods-receipt'
import { PutawayController_findByGrn } from '@/lib/wms-api/api/wms-api/putaway/putaway'
import type {
  GoodsReceiptResponseDto,
  GoodsReceiptWithLinesResponseDto,
  PutawayTaskDto,
} from '@/lib/wms-api/types/wms-api'
import type { Envelope } from '@/features/asns/types/asn'

export interface GrnQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export function useGrnsList(params?: GrnQueryParams) {
  return useQuery({
    queryKey: ['wms', 'grns', 'list', params],
    queryFn: async () => {
      const res = (await ReceivingController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
      } as RequestInit)) as unknown as Envelope<{ data: GoodsReceiptResponseDto[]; total: number; page: number; limit: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0, page: res.data?.page ?? 1, limit: res.data?.limit ?? 20 }
    },
  })
}

export function useGrnById(grnId: string | null) {
  return useQuery({
    queryKey: ['wms', 'grns', grnId],
    queryFn: async () => {
      const res = (await ReceivingController_findById(grnId!)) as unknown as Envelope<GoodsReceiptWithLinesResponseDto>
      return res.data as GoodsReceiptWithLinesResponseDto
    },
    enabled: !!grnId,
  })
}

export function usePutawayTasksByGrn(grnNumber: string | null) {
  return useQuery({
    queryKey: ['wms', 'putaway', 'by-grn', grnNumber],
    queryFn: async () => {
      const res = (await PutawayController_findByGrn(grnNumber!)) as unknown as Envelope<PutawayTaskDto[]>
      return (res.data ?? []) as PutawayTaskDto[]
    },
    enabled: !!grnNumber,
  })
}

export const GRN_STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'IN_RECEIVING', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'] as const

export const GRN_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  IN_RECEIVING: 'In Receiving',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}
