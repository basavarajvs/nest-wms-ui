import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShippingLabelsWebController_generate,
  ShippingLabelsWebController_print,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { GenerateLabelDto } from '@/lib/types/wms-api/generateLabelDto'
import type { PrintLabelDto } from '@/lib/types/wms-api/printLabelDto'

export function useGenerateShippingLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: GenerateLabelDto) => ShippingLabelsWebController_generate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'shipping-labels'] })
    },
  })
}

export function usePrintLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PrintLabelDto }) =>
      ShippingLabelsWebController_print(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'shipping-labels'] })
    },
  })
}
