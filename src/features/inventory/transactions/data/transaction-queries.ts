import { useQuery } from '@tanstack/react-query'

export interface InventoryTransaction {
  id: string
  type?: string
  productId?: string
  facilityId?: string
  locationId?: string
  quantity?: number
  reference?: string
  createdAt?: string
}

interface TransactionQueryParams {
  page?: number
  limit?: number
  type?: string
  productSku?: string
  facilityId?: string
}

export function useInventoryTransactions(_params?: TransactionQueryParams) {
  return useQuery({
    queryKey: ['wms', 'inventory', 'transactions', JSON.stringify(_params ?? {})],
    queryFn: async () => {
      const res: { message?: string } = {
        message: 'No direct transactions list in current web API surface',
      }
      return res
    },
    select: (data) => ({
      transactions: [] as InventoryTransaction[],
      total: 0,
      note:
        data?.message ||
        'Transaction history is viewable in audit logs or per-item history.',
    }),
    staleTime: 1000 * 60,
  })
}

export { useInventoryTransactions as useTransactions }
