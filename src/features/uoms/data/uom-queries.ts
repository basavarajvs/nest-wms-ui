import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import {
  UomController_findAll,
  UomController_findById,
  UomController_create,
  UomController_update,
  UomController_delete,
} from '@/lib/wms-api/api/wms-api/units-of-measure/units-of-measure'
import type { UomResponseDto } from '@/lib/wms-api/types/wms-api'

interface Envelope<T> {
  success: boolean
  data: T
}

const keys = {
  all: ['wms', 'uoms'] as const,
  list: () => ['wms', 'uoms', 'list'] as const,
  detail: (id: number) => ['wms', 'uoms', id] as const,
}

export function useUomsList() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = (await UomController_findAll()) as unknown as Envelope<UomResponseDto[]>
      return (res.data ?? []) as UomResponseDto[]
    },
  })
}

export function useUom(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await UomController_findById(String(id))) as unknown as Envelope<UomResponseDto>
      return res.data as UomResponseDto
    },
    enabled: !!id,
  })
}

export function useCreateUom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      uom_code: string
      uom_name: string
      description?: string
      is_active?: boolean
    }) => {
      const res = (await UomController_create({
        body: data,
      } as RequestInit)) as unknown as Envelope<UomResponseDto>
      return res.data as UomResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('UOM created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateUom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      uom_id: number
      uom_code: string
      uom_name: string
      description?: string
      is_active?: boolean
    }) => {
      const { uom_id, ...body } = data
      const res = (await UomController_update(String(uom_id), {
        body,
      } as RequestInit)) as unknown as Envelope<UomResponseDto>
      return res.data as UomResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('UOM updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteUom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await UomController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('UOM deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
