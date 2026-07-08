import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import {
  BrandController_findAll,
  BrandController_findById,
  BrandController_create,
  BrandController_update,
  BrandController_delete,
} from '@/lib/wms-api/api/wms-api/product-brands/product-brands'
import type { BrandResponseDto } from '@/lib/wms-api/types/wms-api'

interface Envelope<T> {
  success: boolean
  data: T
}

const keys = {
  all: ['wms', 'brands'] as const,
  list: () => ['wms', 'brands', 'list'] as const,
  detail: (id: number) => ['wms', 'brands', id] as const,
}

export function useBrandsList() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = (await BrandController_findAll()) as unknown as Envelope<BrandResponseDto[]>
      return (res.data ?? []) as BrandResponseDto[]
    },
  })
}

export function useBrand(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await BrandController_findById(String(id))) as unknown as Envelope<BrandResponseDto>
      return res.data as BrandResponseDto
    },
    enabled: !!id,
  })
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      brand_code: string
      brand_name: string
      description?: string
      is_active?: boolean
    }) => {
      const res = (await BrandController_create({
        body: data,
      } as RequestInit)) as unknown as Envelope<BrandResponseDto>
      return res.data as BrandResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Brand created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      brand_id: number
      brand_code: string
      brand_name: string
      description?: string
      is_active?: boolean
    }) => {
      const { brand_id, ...body } = data
      const res = (await BrandController_update(String(brand_id), {
        body,
      } as RequestInit)) as unknown as Envelope<BrandResponseDto>
      return res.data as BrandResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Brand updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await BrandController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Brand deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
