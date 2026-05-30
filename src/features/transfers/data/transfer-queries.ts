import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TransferWebController_create,
  TransferWebController_list,
  TransferWebController_dispatch,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateTransferDto,
  TransferWebControllerListParams,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.transfers)) return obj.transfers as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    if (typeof obj.itemsCount === 'number') return obj.itemsCount
    return safeList<unknown>(obj).length
  }
  return 0
}

export interface Transfer {
  id: string
  transferNumber?: string
  transferType?: string
  status?: string
  facilityId?: string
  fromFacilityId?: string
  fromLocationId?: string
  toFacilityId?: string
  toLocationId?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  dispatchedAt?: string
  receivedAt?: string
}

export interface TransferListParams {
  page?: number
  limit?: number
  status?: string
  transferType?: string
  facilityId?: string
}

export function useTransfers(params?: TransferListParams) {
  const queryParams: TransferWebControllerListParams = {
    status: params?.status || '',
    transferType: params?.transferType || '',
  }
  const listParams = {
    ...queryParams,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
    facilityId: params?.facilityId ?? '',
  }

  return useQuery({
    queryKey: ['wms', 'transfers', listParams],
    queryFn: async () => {
      const res = await TransferWebController_list(listParams)
      return res as unknown
    },
    select: (data) => ({
      transfers: safeList<Transfer>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateTransferDto) => {
      return TransferWebController_create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'transfers'] })
    },
  })
}

export function useDispatchTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return TransferWebController_dispatch(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'transfers'] })
    },
  })
}
