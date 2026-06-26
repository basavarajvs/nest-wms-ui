import { useQuery } from '@tanstack/react-query'
import {
  LpnTransactionsWebController_findByLpn,
  LpnTransactionsWebController_findAll,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  LpnTransactionsWebControllerFindAllParams,
} from '@/lib/types/wms-api'

export interface LpnTransaction {
  id: string
  lpnId?: string
  transactionType: string
  fromLocationId?: string
  fromLocationName?: string
  toLocationId?: string
  toLocationName?: string
  quantityBefore?: number
  quantityAfter?: number
  quantityChange?: number
  referenceType?: string
  referenceId?: string
  performedBy?: string
  transactionAt: string
  facilityId?: string
  notes?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.transactions)) return obj.transactions as T[]
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

export function useLpnTransactions(lpnId: string) {
  return useQuery({
    queryKey: ['wms', 'lpns', 'transactions', lpnId],
    queryFn: async () => {
      const res = await LpnTransactionsWebController_findByLpn(lpnId)
      return res as unknown
    },
    select: (data) => ({
      transactions: safeArray<LpnTransaction>(data),
      total: safeTotal(data),
    }),
    enabled: !!lpnId,
    staleTime: 1000 * 30,
  })
}

export function useAllLpnTransactions(params?: LpnTransactionsWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'lpn-transactions', 'all', stableKey],
    queryFn: async () => {
      const res = await LpnTransactionsWebController_findAll(params)
      return res as unknown
    },
    select: (data) => ({
      transactions: safeArray<LpnTransaction>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}
