import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InboundWebController_createGrnFromAsn,
  InboundWebController_createGrnAdHoc,
  InboundWebController_getGrnProgress,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateGrnFromAsnDto, CreateGrnAdHocDto } from '@/lib/types/wms-api'

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

export function useGetGrnProgress() {
  return useMutation({
    mutationFn: async (id: string) => {
      return InboundWebController_getGrnProgress(id)
    },
  })
}
