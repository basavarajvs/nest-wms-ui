import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/inventory/inventory', () => ({
  OnHandWebController_findAll: vi.fn(),
}))

import { useCurrentInventoryList, computeAvailableQty, INVENTORY_STATUS_OPTIONS, INVENTORY_STATUS_LABELS } from '../inventory-queries'
import { OnHandWebController_findAll } from '@/lib/wms-api/api/wms-api/inventory/inventory'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockRecord = {
  inventory_id: 1,
  product_id: 10,
  location_id: 100,
  quantity_on_hand: 100,
  quantity_allocated: 20,
  quantity_reserved: 10,
  quantity_picked: 5,
  quantity_damaged: 2,
  quantity_on_hold: 3,
}

const mockResponse = {
  success: true,
  data: {
    data: [mockRecord],
    total: 1,
    page: 1,
    limit: 20,
  },
}

describe('useCurrentInventoryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls OnHandWebController_findAll on mount', async () => {
    vi.mocked(OnHandWebController_findAll).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCurrentInventoryList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(OnHandWebController_findAll).toHaveBeenCalledTimes(1)
  })

  it('passes query params to the API', async () => {
    vi.mocked(OnHandWebController_findAll).mockResolvedValue(mockResponse)

    const params = { page: 1, limit: 50, search: 'SKU-001', status: 'IN_STOCK' }
    renderHook(() => useCurrentInventoryList(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(OnHandWebController_findAll).toHaveBeenCalled())

    const callArg = vi.mocked(OnHandWebController_findAll).mock.calls[0][0] as RequestInit
    expect(callArg.params).toEqual({
      page: 1,
      limit: 50,
      search: 'SKU-001',
      product_id: undefined,
      location_id: undefined,
      status: 'IN_STOCK',
    })
  })

  it('transforms response into { data, total, page, limit }', async () => {
    vi.mocked(OnHandWebController_findAll).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCurrentInventoryList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data!.data).toHaveLength(1)
    expect(result.current.data!.total).toBe(1)
    expect(result.current.data!.page).toBe(1)
    expect(result.current.data!.limit).toBe(20)
  })

  it('returns defaults when response data is empty', async () => {
    vi.mocked(OnHandWebController_findAll).mockResolvedValue({
      success: true,
      data: { data: undefined, total: undefined, page: undefined, limit: undefined },
    })

    const { result } = renderHook(() => useCurrentInventoryList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data!.data).toEqual([])
    expect(result.current.data!.total).toBe(0)
  })

  it('sets isError on failure', async () => {
    vi.mocked(OnHandWebController_findAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCurrentInventoryList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('starts in loading state', async () => {
    vi.mocked(OnHandWebController_findAll).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useCurrentInventoryList(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})

describe('computeAvailableQty', () => {
  it('calculates available quantity correctly', () => {
    const available = computeAvailableQty(mockRecord)
    expect(available).toBe(60)
  })

  it('returns 0 when allocations exceed on-hand', () => {
    const result = computeAvailableQty({
      ...mockRecord,
      quantity_on_hand: 10,
      quantity_allocated: 15,
    })
    expect(result).toBe(0)
  })

  it('handles zero quantities', () => {
    const result = computeAvailableQty({
      ...mockRecord,
      quantity_on_hand: 0,
      quantity_allocated: 0,
      quantity_reserved: 0,
      quantity_picked: 0,
      quantity_damaged: 0,
      quantity_on_hold: 0,
    })
    expect(result).toBe(0)
  })

  it('does not return negative values', () => {
    const result = computeAvailableQty({
      ...mockRecord,
      quantity_on_hand: 5,
      quantity_allocated: 10,
      quantity_reserved: 5,
    })
    expect(result).toBe(0)
  })
})

describe('INVENTORY_STATUS_OPTIONS', () => {
  it('defines all status options', () => {
    const values = INVENTORY_STATUS_OPTIONS.map((o) => o.value)
    expect(values).toContain('IN_STOCK')
    expect(values).toContain('ALLOCATED')
    expect(values).toContain('ON_HOLD')
    expect(values).toContain('DAMAGED')
    expect(values).toContain('OUT_OF_STOCK')
  })

  it('has corresponding labels in INVENTORY_STATUS_LABELS', () => {
    for (const opt of INVENTORY_STATUS_OPTIONS) {
      expect(INVENTORY_STATUS_LABELS[opt.value]).toBeDefined()
      expect(INVENTORY_STATUS_LABELS[opt.value]).toBe(opt.label)
    }
  })
})
