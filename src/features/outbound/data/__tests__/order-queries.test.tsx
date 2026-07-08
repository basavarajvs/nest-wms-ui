import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/outbound-sales-orders/outbound-sales-orders', () => ({
  SalesOrderWebController_findAll: vi.fn(),
  SalesOrderWebController_findById: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/outbound-allocation/outbound-allocation', () => ({
  AllocationWebController_findByOrderId: vi.fn(),
  AllocationWebController_allocateOrder: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/outbound-picking-tasks/outbound-picking-tasks', () => ({
  PickingTaskWebController_findAll: vi.fn(),
}))

import { useOrdersList, useOrderById, useOrderAllocations, useOrderPickingTasks, useAllocateOrder, ORDER_STATUS_OPTIONS, ORDER_STATUS_LABELS } from '../order-queries'
import { SalesOrderWebController_findAll, SalesOrderWebController_findById } from '@/lib/wms-api/api/wms-api/outbound-sales-orders/outbound-sales-orders'
import { AllocationWebController_findByOrderId, AllocationWebController_allocateOrder } from '@/lib/wms-api/api/wms-api/outbound-allocation/outbound-allocation'
import { PickingTaskWebController_findAll } from '@/lib/wms-api/api/wms-api/outbound-picking-tasks/outbound-picking-tasks'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockOrder = {
  order_id: 'ORD-001',
  order_number: 'SO-2026-001',
  status: 'NEW',
  customer_name: 'Acme Corp',
}

const mockListResponse = {
  success: true,
  data: { data: [mockOrder], total: 1, page: 1, limit: 20 },
}

describe('useOrdersList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls SalesOrderWebController_findAll on mount', async () => {
    vi.mocked(SalesOrderWebController_findAll).mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useOrdersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(SalesOrderWebController_findAll).toHaveBeenCalledTimes(1)
  })

  it('passes query params to API', async () => {
    vi.mocked(SalesOrderWebController_findAll).mockResolvedValue(mockListResponse)
    const params = { page: 1, limit: 25, search: 'SO-2026', status: 'NEW' }
    renderHook(() => useOrdersList(params), { wrapper: createWrapper() })
    await waitFor(() => expect(SalesOrderWebController_findAll).toHaveBeenCalled())
    const callArg = vi.mocked(SalesOrderWebController_findAll).mock.calls[0][0] as RequestInit
    expect(callArg.params).toEqual(params)
  })

  it('transforms response into { data, total, page, limit }', async () => {
    vi.mocked(SalesOrderWebController_findAll).mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useOrdersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.data).toEqual([mockOrder])
    expect(result.current.data!.total).toBe(1)
    expect(result.current.data!.page).toBe(1)
    expect(result.current.data!.limit).toBe(20)
  })

  it('returns empty data fallback when response is empty', async () => {
    vi.mocked(SalesOrderWebController_findAll).mockResolvedValue({
      success: true, data: { data: undefined, total: undefined, page: undefined, limit: undefined },
    })
    const { result } = renderHook(() => useOrdersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data!.data).toEqual([])
    expect(result.current.data!.total).toBe(0)
  })

  it('sets isError on API failure', async () => {
    vi.mocked(SalesOrderWebController_findAll).mockRejectedValue(new Error('API Error'))
    const { result } = renderHook(() => useOrdersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('starts in loading state', async () => {
    vi.mocked(SalesOrderWebController_findAll).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useOrdersList(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })
})

describe('useOrderById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches order by id', async () => {
    vi.mocked(SalesOrderWebController_findById).mockResolvedValue({
      success: true, data: mockOrder,
    })
    const { result } = renderHook(() => useOrderById('ORD-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(SalesOrderWebController_findById).toHaveBeenCalledWith('ORD-001')
    expect(result.current.data).toEqual(mockOrder)
  })

  it('does not fetch when id is null', () => {
    renderHook(() => useOrderById(null), { wrapper: createWrapper() })
    expect(SalesOrderWebController_findById).not.toHaveBeenCalled()
  })
})

describe('useOrderAllocations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches allocations by order id', async () => {
    const mockAllocations = [{ allocation_id: 1, product_id: 10, quantity: 5 }]
    vi.mocked(AllocationWebController_findByOrderId).mockResolvedValue({
      success: true, data: mockAllocations,
    })
    const { result } = renderHook(() => useOrderAllocations('ORD-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(AllocationWebController_findByOrderId).toHaveBeenCalledWith('ORD-001')
    expect(result.current.data).toEqual(mockAllocations)
  })

  it('returns empty array when data is null', async () => {
    vi.mocked(AllocationWebController_findByOrderId).mockResolvedValue({
      success: true, data: null,
    })
    const { result } = renderHook(() => useOrderAllocations('ORD-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })
})

describe('useOrderPickingTasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches picking tasks by order id', async () => {
    vi.mocked(PickingTaskWebController_findAll).mockResolvedValue({
      success: true, data: { data: [{ task_id: 1 }], total: 1 },
    })
    const { result } = renderHook(() => useOrderPickingTasks('ORD-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(PickingTaskWebController_findAll).toHaveBeenCalled()
    expect(result.current.data!.data).toEqual([{ task_id: 1 }])
    expect(result.current.data!.total).toBe(1)
  })

  it('does not fetch when id is null', () => {
    renderHook(() => useOrderPickingTasks(null), { wrapper: createWrapper() })
    expect(PickingTaskWebController_findAll).not.toHaveBeenCalled()
  })
})

describe('useAllocateOrder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls allocate mutation with dto', async () => {
    vi.mocked(AllocationWebController_allocateOrder).mockResolvedValue({
      success: true, data: { orderId: 'ORD-001', results: [], totalShort: 0 },
    })
    const { result } = renderHook(() => useAllocateOrder(), { wrapper: createWrapper() })
    result.current.mutate({ order_id: 'ORD-001', allocate_full: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(AllocationWebController_allocateOrder).toHaveBeenCalledWith({ order_id: 'ORD-001', allocate_full: true })
  })

  it('returns allocation result with totalShort', async () => {
    vi.mocked(AllocationWebController_allocateOrder).mockResolvedValue({
      success: true, data: { orderId: 'ORD-001', results: [], totalShort: 3 },
    })
    const { result } = renderHook(() => useAllocateOrder(), { wrapper: createWrapper() })
    let data: unknown
    result.current.mutate(
      { order_id: 'ORD-001', allocate_full: true },
      { onSuccess: (d) => { data = d } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(data).toMatchObject({ totalShort: 3 })
  })
})

describe('ORDER_STATUS_OPTIONS', () => {
  it('defines all status options', () => {
    expect(ORDER_STATUS_OPTIONS).toContain('NEW')
    expect(ORDER_STATUS_OPTIONS).toContain('ALLOCATED')
    expect(ORDER_STATUS_OPTIONS).toContain('PICKING')
    expect(ORDER_STATUS_OPTIONS).toContain('PACKED')
    expect(ORDER_STATUS_OPTIONS).toContain('SHIPPED')
    expect(ORDER_STATUS_OPTIONS).toContain('CANCELLED')
  })

  it('has all labels mapped in ORDER_STATUS_LABELS', () => {
    for (const opt of ORDER_STATUS_OPTIONS) {
      expect(ORDER_STATUS_LABELS[opt]).toBeDefined()
    }
  })
})
