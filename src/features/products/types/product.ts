export type {
  ProductResponseDto,
  PaginatedResponseDto,
} from '@/lib/wms-api/types/wms-api'

import type { ProductResponseDto } from '@/lib/wms-api/types/wms-api'

export type Product = ProductResponseDto

export interface CreateProductDto {
  product_code: string
  product_name: string
  description?: string
  brand_id?: number
  category_id?: number
  primary_uom_id?: number
  is_active?: boolean
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  product_id: number
}

export interface ProductQueryParams {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
  category_id?: number
}

export interface ProductListEnvelope {
  success: boolean
  data: {
    data: ProductResponseDto[]
    total: number
    page?: number
    limit?: number
  }
}

export interface ProductEnvelope {
  success: boolean
  data: ProductResponseDto
}
