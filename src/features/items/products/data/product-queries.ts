import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ProductsWebController_findAll,
  ProductsWebController_create,
  ProductsWebController_update,
  ProductsWebController_remove,
  ProductsWebController_uploadImport,
  ProductsWebController_getImportStatus,
  getProductsWebControllerDownloadErrorCsvUrl,
} from '@/lib/api/wms-api/wms-web/wms-web'
import { AXIOS_INSTANCE } from '@/lib/httpClient'
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductsWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.products)) return obj.products as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    const arr = safeArray(obj)
    return arr.length || fallback
  }
  return fallback
}

export interface Product {
  id: string
  productCode: string
  name: string
  description?: string
  baseUomId?: string
  categoryId?: string
  productType?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  volume?: number
  unitWeight?: number
  storageRequirements?: string
  hazardousClass?: string
  storageConditions?: string
  imageUrl?: string
  manufacturer?: string
  countryOfOrigin?: string
  trackLot?: boolean
  trackSerial?: boolean
  trackExpiry?: boolean
  velocityClass?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export function useProducts(params?: ProductsWebControllerFindAllParams & { page?: number; limit?: number }) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'products', 'list', stableKey],
    queryFn: async () => {
      const res = await ProductsWebController_findAll(params as ProductsWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      products: safeArray<Product>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['wms', 'products', 'detail', id],
    queryFn: async () => {
      const res = await ProductsWebController_findAll({ search: id } as ProductsWebControllerFindAllParams)
      const data = res as unknown
      const items = safeArray<Product>(data)
      return items.find((p) => p.id === id) ?? items[0] ?? null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      return ProductsWebController_create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProductDto }) => {
      return ProductsWebController_update(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return ProductsWebController_remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}

export function useUploadImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await ProductsWebController_uploadImport({ body: formData })
      return res as unknown
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}

export function useImportStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['wms', 'products', 'import', 'status', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const res = await ProductsWebController_getImportStatus(jobId)
      return (res ?? {}) as Record<string, unknown>
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as Record<string, unknown> | undefined
      const nested = data?.data as Record<string, unknown> | undefined
      const status = String(data?.status || nested?.status || '').toUpperCase()
      return status === 'PENDING' || status === 'PROCESSING' ? 2000 : false
    },
    staleTime: 0,
  })
}

export async function downloadImportErrors(jobId: string): Promise<void> {
  const url = getProductsWebControllerDownloadErrorCsvUrl(jobId)
  const response = await AXIOS_INSTANCE.get(url, { responseType: 'blob' })
  const blob = response.data as Blob
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `import-errors-${jobId}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(link.href)
}
