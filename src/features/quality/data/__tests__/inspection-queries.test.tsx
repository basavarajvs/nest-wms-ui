import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/quality/quality', () => ({
  ReceivingInspectionController_findAll: vi.fn(),
  ReceivingInspectionController_findById: vi.fn(),
  InspectionWebController_supervisorApprove: vi.fn(),
  InspectionWebController_supervisorReject: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/inspection-defects/inspection-defects', () => ({
  InspectionDefectController_findAll: vi.fn(),
}))

import { useInspectionsList, useInspectionById, useApproveInspection, useRejectInspection, useInspectionDefects, INSPECTION_STATUS_OPTIONS, INSPECTION_STATUS_LABELS } from '../inspection-queries'
import { ReceivingInspectionController_findAll, ReceivingInspectionController_findById, InspectionWebController_supervisorApprove, InspectionWebController_supervisorReject } from '@/lib/wms-api/api/wms-api/quality/quality'
import { InspectionDefectController_findAll } from '@/lib/wms-api/api/wms-api/inspection-defects/inspection-defects'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockInspection = {
  inspection_id: 'INSP-001',
  status: 'PENDING',
  product_id: 10,
}

const mockListResponse = {
  success: true,
  data: { data: [mockInspection], total: 1, page: 1, limit: 20 },
}

describe('useInspectionsList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls ReceivingInspectionController_findAll on mount', async () => {
    vi.mocked(ReceivingInspectionController_findAll).mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useInspectionsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(ReceivingInspectionController_findAll).toHaveBeenCalledTimes(1)
  })

  it('passes query params', async () => {
    vi.mocked(ReceivingInspectionController_findAll).mockResolvedValue(mockListResponse)
    const params = { page: 1, limit: 10, status: 'PENDING' }
    renderHook(() => useInspectionsList(params), { wrapper: createWrapper() })
    await waitFor(() => expect(ReceivingInspectionController_findAll).toHaveBeenCalled())
    const callArg = vi.mocked(ReceivingInspectionController_findAll).mock.calls[0][0] as RequestInit
    expect(callArg.params).toEqual(params)
  })

  it('transforms response into { data, total, page, limit }', async () => {
    vi.mocked(ReceivingInspectionController_findAll).mockResolvedValue(mockListResponse)
    const { result } = renderHook(() => useInspectionsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.data).toEqual([mockInspection])
    expect(result.current.data!.total).toBe(1)
  })

  it('returns empty fallbacks when data is undefined', async () => {
    vi.mocked(ReceivingInspectionController_findAll).mockResolvedValue({
      success: true, data: { data: undefined, total: undefined, page: undefined, limit: undefined },
    })
    const { result } = renderHook(() => useInspectionsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data!.data).toEqual([])
    expect(result.current.data!.total).toBe(0)
  })

  it('sets isError on failure', async () => {
    vi.mocked(ReceivingInspectionController_findAll).mockRejectedValue(new Error('API Error'))
    const { result } = renderHook(() => useInspectionsList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useInspectionById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches inspection by id', async () => {
    vi.mocked(ReceivingInspectionController_findById).mockResolvedValue({
      success: true, data: mockInspection,
    })
    const { result } = renderHook(() => useInspectionById('INSP-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(ReceivingInspectionController_findById).toHaveBeenCalledWith('INSP-001')
    expect(result.current.data).toEqual(mockInspection)
  })

  it('does not fetch when id is null', () => {
    renderHook(() => useInspectionById(null), { wrapper: createWrapper() })
    expect(ReceivingInspectionController_findById).not.toHaveBeenCalled()
  })
})

describe('useApproveInspection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls approve mutation with id and optional data', async () => {
    vi.mocked(InspectionWebController_supervisorApprove).mockResolvedValue({
      success: true, data: { approved: true, inspectionId: 'INSP-001' },
    })
    const { result } = renderHook(() => useApproveInspection(), { wrapper: createWrapper() })
    result.current.mutate({ id: 'INSP-001', data: { comments: 'Approved' } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(InspectionWebController_supervisorApprove).toHaveBeenCalledWith('INSP-001', { comments: 'Approved' })
  })

  it('returns approval result', async () => {
    vi.mocked(InspectionWebController_supervisorApprove).mockResolvedValue({
      success: true, data: { approved: true, inspectionId: 'INSP-001' },
    })
    const { result } = renderHook(() => useApproveInspection(), { wrapper: createWrapper() })
    let data: unknown
    result.current.mutate(
      { id: 'INSP-001' },
      { onSuccess: (d) => { data = d } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(data).toMatchObject({ approved: true })
  })
})

describe('useRejectInspection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls reject mutation with id', async () => {
    vi.mocked(InspectionWebController_supervisorReject).mockResolvedValue({
      success: true, data: { rejected: true, originalInspectionId: 'INSP-001', newInspectionId: 'INSP-002' },
    })
    const { result } = renderHook(() => useRejectInspection(), { wrapper: createWrapper() })
    result.current.mutate('INSP-001')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(InspectionWebController_supervisorReject).toHaveBeenCalledWith('INSP-001')
  })
})

describe('useInspectionDefects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches defects for an inspection', async () => {
    vi.mocked(InspectionDefectController_findAll).mockResolvedValue({
      success: true, data: { data: [{ defect_id: 1, code: 'DENT' }], total: 1 },
    })
    const { result } = renderHook(() => useInspectionDefects('INSP-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(InspectionDefectController_findAll).toHaveBeenCalled()
    expect(result.current.data).toEqual([{ defect_id: 1, code: 'DENT' }])
  })

  it('returns empty array when no defects', async () => {
    vi.mocked(InspectionDefectController_findAll).mockResolvedValue({
      success: true, data: null,
    })
    const { result } = renderHook(() => useInspectionDefects('INSP-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('does not fetch when id is null', () => {
    renderHook(() => useInspectionDefects(null), { wrapper: createWrapper() })
    expect(InspectionDefectController_findAll).not.toHaveBeenCalled()
  })
})

describe('INSPECTION_STATUS_OPTIONS', () => {
  it('defines all inspection statuses', () => {
    const values = INSPECTION_STATUS_OPTIONS.map((o) => o.value)
    expect(values).toContain('PENDING')
    expect(values).toContain('IN_PROGRESS')
    expect(values).toContain('PENDING_REVIEW')
    expect(values).toContain('PASSED')
    expect(values).toContain('FAILED')
    expect(values).toContain('CLOSED')
    expect(values).toContain('CANCELLED')
  })

  it('has all labels mapped in INSPECTION_STATUS_LABELS', () => {
    for (const opt of INSPECTION_STATUS_OPTIONS) {
      expect(INSPECTION_STATUS_LABELS[opt.value]).toBe(opt.label)
    }
  })
})
