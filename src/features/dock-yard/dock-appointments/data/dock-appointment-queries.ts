import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DockAppointmentWebController_create,
  DockAppointmentWebController_list,
  DockAppointmentWebController_checkIn,
  DockAppointmentWebController_complete,
  DockAppointmentWebController_cancel,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateAppointmentDto,
  DockAppointmentWebControllerListParams,
} from '@/lib/types/wms-api'

export interface DockAppointment {
  id: string
  appointmentNumber: string
  appointmentType: string
  facilityId: string
  dockId: string
  dockName?: string
  status: string
  scheduledStart: string
  scheduledEnd: string
  carrierCode?: string
  carrierName?: string
  driverName?: string
  driverPhone?: string
  vehiclePlate?: string
  trailerId?: string
  referenceType?: string
  referenceNumber?: string
  notes?: string
  checkedInAt?: string
  completedAt?: string
  createdAt: string
  updatedAt?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.appointments)) return obj.appointments as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    return safeArray(data).length
  }
  return 0
}

export function useAppointmentList(params?: Partial<DockAppointmentWebControllerListParams>) {
  const qp = { facilityId: params?.facilityId || '', dockId: params?.dockId || '', date: params?.date || '', status: params?.status || '' }
  return useQuery({
    queryKey: ['wms', 'dock', 'appointments', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await DockAppointmentWebController_list(p as DockAppointmentWebControllerListParams)
      return res as unknown
    },
    select: (data) => ({ appointments: safeArray<DockAppointment>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAppointmentDto) => DockAppointmentWebController_create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'dock', 'appointments'] }),
  })
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => DockAppointmentWebController_checkIn(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'dock', 'appointments'] }),
  })
}

export function useCompleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => DockAppointmentWebController_complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'dock', 'appointments'] }),
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => DockAppointmentWebController_cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'dock', 'appointments'] }),
  })
}
