import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/product-brands/product-brands', () => ({
  BrandController_findAll: vi.fn(),
  BrandController_findById: vi.fn(),
  BrandController_create: vi.fn(),
  BrandController_update: vi.fn(),
  BrandController_delete: vi.fn(),
}))

import { useBrandsList, useBrand, useCreateBrand, useUpdateBrand, useDeleteBrand } from '../brand-queries'
import { BrandController_findAll, BrandController_findById, BrandController_create, BrandController_update, BrandController_delete } from '@/lib/wms-api/api/wms-api/product-brands/product-brands'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockBrand = {
  brand_id: 1,
  brand_code: 'BRD-001',
  brand_name: 'Test Brand',
  is_active: true,
}

describe('useBrandsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls BrandController_findAll on mount', async () => {
    vi.mocked(BrandController_findAll).mockResolvedValue({
      success: true,
      data: [mockBrand],
    })

    const { result } = renderHook(() => useBrandsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(BrandController_findAll).toHaveBeenCalledTimes(1)
  })

  it('returns brands array from response.data', async () => {
    vi.mocked(BrandController_findAll).mockResolvedValue({
      success: true,
      data: [mockBrand],
    })

    const { result } = renderHook(() => useBrandsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0]).toEqual(mockBrand)
  })

  it('returns empty array when data is null', async () => {
    vi.mocked(BrandController_findAll).mockResolvedValue({
      success: false,
      data: null,
    })

    const { result } = renderHook(() => useBrandsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([])
  })

  it('handles error state', async () => {
    vi.mocked(BrandController_findAll).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useBrandsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('starts in loading state', async () => {
    vi.mocked(BrandController_findAll).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useBrandsList(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})

describe('useBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches brand by id', async () => {
    vi.mocked(BrandController_findById).mockResolvedValue({
      success: true,
      data: mockBrand,
    })

    const { result } = renderHook(() => useBrand(1), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(BrandController_findById).toHaveBeenCalledWith('1')
    expect(result.current.data).toEqual(mockBrand)
  })

  it('does not fetch when id is 0', () => {
    renderHook(() => useBrand(0), {
      wrapper: createWrapper(),
    })

    expect(BrandController_findById).not.toHaveBeenCalled()
  })
})

describe('useCreateBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls create mutation with payload', async () => {
    vi.mocked(BrandController_create).mockResolvedValue({
      success: true,
      data: mockBrand,
    })

    const { result } = renderHook(() => useCreateBrand(), {
      wrapper: createWrapper(),
    })

    const payload = { brand_code: 'BRD-002', brand_name: 'New Brand' }
    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(BrandController_create).toHaveBeenCalledTimes(1)
  })
})

describe('useUpdateBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls update mutation with id and body', async () => {
    vi.mocked(BrandController_update).mockResolvedValue({
      success: true,
      data: mockBrand,
    })

    const { result } = renderHook(() => useUpdateBrand(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      brand_id: 1,
      brand_code: 'BRD-001',
      brand_name: 'Updated Brand',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(BrandController_update).toHaveBeenCalledWith('1', { body: { brand_code: 'BRD-001', brand_name: 'Updated Brand' } })
  })
})

describe('useDeleteBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls delete with id', async () => {
    vi.mocked(BrandController_delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteBrand(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(BrandController_delete).toHaveBeenCalledWith('1')
  })
})
