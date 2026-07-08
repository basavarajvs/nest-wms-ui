import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import {
  ProductController_findAll,
  ProductController_findById,
  ProductController_create,
  ProductController_update,
  ProductController_delete,
} from '@/lib/wms-api/api/wms-api/products/products'
import type {
  CreateProductDto,
  Product,
  ProductEnvelope,
  ProductListEnvelope,
  ProductQueryParams,
  UpdateProductDto,
} from '@/features/products/types/product'

const productKeys = {
  all: ['products'] as const,
  list: (params?: ProductQueryParams) => ['products', 'list', params] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
}

export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const response = (await ProductController_findAll({
        params,
      } as RequestInit)) as unknown as ProductListEnvelope
      return response
    },
    select: (data) => ({
      products: (data.data?.data ?? []) as Product[],
      total: data.data?.total ?? 0,
    }),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = (await ProductController_findById(
        String(id),
      )) as unknown as ProductEnvelope
      return response.data as Product
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const response = (await ProductController_create({
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      } as RequestInit)) as unknown as ProductEnvelope
      return response.data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showSuccess('Product created successfully')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateProductDto) => {
      const { product_id, ...body } = data
      const response = (await ProductController_update(String(product_id), {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      } as RequestInit)) as unknown as ProductEnvelope
      return response.data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showSuccess('Product updated successfully')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await ProductController_delete(String(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      showSuccess('Product deleted successfully')
    },
    onError: (error) => handleServerError(error),
  })
}
