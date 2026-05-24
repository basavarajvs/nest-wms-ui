import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InventoryWebController_upsertPolicy } from '@/lib/api/wms-api/wms-web/wms-web'
import type { UpsertPolicyDto } from '@/lib/types/wms-api'

export interface PolicyFormValues extends UpsertPolicyDto {
  reorderPoint?: number
  safetyStock?: number
  maxLevel?: number
  minOrderQty?: number
}

export function useUpsertPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: UpsertPolicyDto) => {
      // Note: DTO only has facilityId, productId, locationId?, isActive?
      // Extra policy fields (reorderPoint etc.) may be accepted by backend
      // but are not present in the generated UpsertPolicyDto.
      return InventoryWebController_upsertPolicy(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory', 'policies'] })
    },
  })
}
