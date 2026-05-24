import { useMutation } from '@tanstack/react-query'
import { OutboundWebController_generateManifest } from '@/lib/api/wms-api/wms-web/wms-web'
import type { GenerateManifestDto } from '@/lib/types/wms-api'

export function useGenerateManifest() {
  return useMutation({
    mutationFn: async (dto: GenerateManifestDto) => {
      return OutboundWebController_generateManifest(dto)
    },
  })
}
