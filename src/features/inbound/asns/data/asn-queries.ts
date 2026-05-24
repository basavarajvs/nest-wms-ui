import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InboundWebController_createAsn,
  InboundWebController_previewAsn,
  InboundWebController_updateAsnStatus,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateAsnDto, UpdateAsnStatusDto } from '@/lib/types/wms-api'

export interface AsnCreateInput extends CreateAsnDto {}

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

export function useUpdateAsnStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateAsnStatusDto }) => {
      return InboundWebController_updateAsnStatus(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'asn'] })
    },
  })
}
