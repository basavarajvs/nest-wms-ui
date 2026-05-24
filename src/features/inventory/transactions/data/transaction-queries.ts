import { useQuery } from '@tanstack/react-query'

// Placeholder - no dedicated Inventory Transactions list endpoint exposed in current WMS Web API
// Transactions are typically available via SaaS Core audit logs or item movement history views.

export interface InventoryTransaction {
  id: string
  type?: string
  productId?: string
  facilityId?: string
  locationId?: string
  quantity?: number
  reference?: string
  createdAt?: string
  [key: string]: any
}

export function useInventoryTransactions(_params: any = {}) {
  // Returns empty until a real endpoint (e.g. audit or dedicated history) is added to web controller
  return useQuery({
    queryKey: ['wms', 'inventory', 'transactions', _params],
    queryFn: async () => {
      // Future: call a real controller when available, e.g. InventoryTransactionController or audit
      return { items: [], message: 'No direct transactions list in current web API surface' } as unknown
    },
    select: (data: any) => ({
      transactions: [] as InventoryTransaction[],
      note: data?.message || 'Transaction history is viewable in audit logs or per-item history (not yet exposed via /web/inventory/transactions).',
    }),
    staleTime: 1000 * 60,
  })
}
