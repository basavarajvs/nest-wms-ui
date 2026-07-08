import { useQuery } from '@tanstack/react-query'
import { BrandController_findAll } from '@/lib/wms-api/api/wms-api/product-brands/product-brands'
import { CategoryController_findAll } from '@/lib/wms-api/api/wms-api/product-categories/product-categories'
import { UomController_findAll } from '@/lib/wms-api/api/wms-api/units-of-measure/units-of-measure'
import type { BrandResponseDto, CategoryResponseDto, UomResponseDto } from '@/lib/wms-api/types/wms-api'

interface Envelope<T> {
  success: boolean
  data: T
}

export function useBrands() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'brands'],
    queryFn: async () => {
      const response = (await BrandController_findAll()) as unknown as Envelope<BrandResponseDto[]>
      return response.data ?? []
    },
    select: (brands) =>
      brands.map((b) => ({
        value: String(b.brand_id),
        label: b.brand_name,
      })),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'categories'],
    queryFn: async () => {
      const response = (await CategoryController_findAll()) as unknown as Envelope<{ categories: CategoryResponseDto[] }>
      return response.data?.categories ?? []
    },
    select: (categories) =>
      categories.map((c) => ({
        value: String(c.category_id),
        label: c.category_name,
      })),
  })
}

export function useUoms() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'uoms'],
    queryFn: async () => {
      const response = (await UomController_findAll()) as unknown as Envelope<UomResponseDto[]>
      return response.data ?? []
    },
    select: (uoms) =>
      uoms.map((u) => ({
        value: String(u.uom_id),
        label: u.uom_name,
      })),
  })
}

export type { BrandResponseDto, CategoryResponseDto, UomResponseDto }
