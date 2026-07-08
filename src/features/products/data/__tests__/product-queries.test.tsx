import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/products/products', () => ({
  ProductController_findAll: vi.fn(),
  ProductController_findById: vi.fn(),
  ProductController_create: vi.fn(),
  ProductController_update: vi.fn(),
  ProductController_delete: vi.fn(),
}))

import { useProducts, useProduct, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../product-queries'
import { ProductController_findAll, ProductController_findById, ProductController_create, ProductController_update, ProductController_delete } from '@/lib/wms-api/api/wms-api/products/products'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockProduct = {
  product_id: 1,
  product_code: 'PROD-001',
  product_name: 'Test Product',
  is_active: true,
}

const mockResponse = {
  success: true,
  data: {
    data: [mockProduct],
    total: 1,
    page: 1,
    limit: 20,
  },
}

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls ProductController_findAll on mount', async () => {
    vi.mocked(ProductController_findAll).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(ProductController_findAll).toHaveBeenCalledTimes(1)
  })

  it('passes params to the API call', async () => {
    vi.mocked(ProductController_findAll).mockResolvedValue(mockResponse)

    const params = { page: 2, limit: 10 }
    renderHook(() => useProducts(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(ProductController_findAll).toHaveBeenCalled())

    const callArg = vi.mocked(ProductController_findAll).mock.calls[0][0] as RequestInit
    expect(callArg.params).toEqual(params)
  })

  it('transforms data via select', async () => {
    vi.mocked(ProductController_findAll).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data!.products).toHaveLength(1)
    expect(result.current.data!.products[0]).toEqual(mockProduct)
    expect(result.current.data!.total).toBe(1)
  })

  it('returns empty array when response has no data', async () => {
    vi.mocked(ProductController_findAll).mockResolvedValue({
      success: true,
      data: { data: undefined, total: undefined },
    })

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data!.products).toEqual([])
    expect(result.current.data!.total).toBe(0)
  })

  it('sets isError when API call fails', async () => {
    vi.mocked(ProductController_findAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('starts in loading state', async () => {
    vi.mocked(ProductController_findAll).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})

describe('useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches product by id', async () => {
    vi.mocked(ProductController_findById).mockResolvedValue({
      success: true,
      data: mockProduct,
    })

    const { result } = renderHook(() => useProduct(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(ProductController_findById).toHaveBeenCalledWith('1')
    expect(result.current.data).toEqual(mockProduct)
  })

  it('does not fetch when id is 0', async () => {
    renderHook(() => useProduct(0), {
      wrapper: createWrapper(),
    })

    expect(ProductController_findById).not.toHaveBeenCalled()
  })
})

describe('useCreateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls create mutation with correct payload', async () => {
    vi.mocked(ProductController_create).mockResolvedValue({
      success: true,
      data: mockProduct,
    })

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(),
    })

    const payload = {
      product_code: 'PROD-002',
      product_name: 'New Product',
    }

    result.current.mutate(payload)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(ProductController_create).toHaveBeenCalledTimes(1)
    const callArg = vi.mocked(ProductController_create).mock.calls[0][0] as RequestInit
    expect(callArg.body).toBe(JSON.stringify(payload))
  })

  it('returns the created product', async () => {
    vi.mocked(ProductController_create).mockResolvedValue({
      success: true,
      data: mockProduct,
    })

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: createWrapper(),
    })

    let data: unknown
    result.current.mutate(
      { product_code: 'PROD-002', product_name: 'New Product' },
      { onSuccess: (d) => { data = d } },
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(data).toEqual(mockProduct)
  })
})

describe('useUpdateProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls update mutation with correct payload', async () => {
    vi.mocked(ProductController_update).mockResolvedValue({
      success: true,
      data: mockProduct,
    })

    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: createWrapper(),
    })

    const payload = { product_id: 1, product_name: 'Updated Name' }
    result.current.mutate(payload)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(ProductController_update).toHaveBeenCalledWith('1', expect.anything())
  })
})

describe('useDeleteProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls delete mutation with product id', async () => {
    vi.mocked(ProductController_delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(1)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(ProductController_delete).toHaveBeenCalledWith('1')
  })
})
