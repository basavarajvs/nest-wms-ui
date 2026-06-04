import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TransferWebController_create,
  TransferWebController_list,
  TransferWebController_dispatch,
  TransferWebController_receive,
  TransferWebController_listLines,
  TransferWebController_updateLine,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateTransferDto,
  TransferWebControllerListParams,
  TransferWebControllerListLinesParams,
  WebReceiveTransferDto,
  UpdateTransferLineDto,
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

export function useReceiveTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: WebReceiveTransferDto }) => {
      return TransferWebController_receive(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'transfers'] })
    },
  })
}

export interface TransferLine {
  id: string
  transferId?: string
  productId?: string
  productName?: string
  productSku?: string
  quantityRequested?: number
  quantityShipped?: number
  quantityReceived?: number
  status?: string
  createdAt?: string
  updatedAt?: string
}

export function useTransferLines(transferId: string, params?: TransferWebControllerListLinesParams) {
  const stableKey = JSON.stringify({ transferId, ...params })
  return useQuery({
    queryKey: ['wms', 'transfers', 'lines', stableKey],
    queryFn: async () => {
      const res = await TransferWebController_listLines({
        transferId,
        ...params,
      } as TransferWebControllerListLinesParams)
      return res as unknown
    },
    select: (data) => ({
      lines: safeList<TransferLine>(data),
      total: safeTotal(data),
    }),
    enabled: !!transferId,
    staleTime: 1000 * 30,
  })
}

export function useUpdateTransferLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTransferLineDto }) => {
      return TransferWebController_updateLine(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'transfers'] })
    },
  })
}

export interface CreateTransferLineDto {
  productId: string
  quantityRequested: number
  uomId?: string
}

export function useCreateTransferLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_dto: CreateTransferLineDto) => {
      console.warn(
        '[GAP] useCreateTransferLine: No backend endpoint POST /api/v1/wms/web/transfers/lines exists yet. Returned empty placeholder.'
      )
      return {} as unknown
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'transfers'] })
    },
  })
}

export function useDeleteTransferLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_id: string) => {
      console.warn(
        '[GAP] useDeleteTransferLine: No backend endpoint DELETE /api/v1/wms/web/transfers/lines/{id} exists yet. Returned empty placeholder.'
      )
      return {} as unknown
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'transfers'] })
    },
  })
}
