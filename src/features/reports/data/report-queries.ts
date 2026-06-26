import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ReportsController_requestReport,
  ReportsController_getStatus,
  getReportsControllerDownloadCompletedUrl,
  getReportsControllerDownloadLiveUrl,
  getReportsControllerGetTemplateUrl,
} from '@/lib/api/wms-api/wms-web/wms-web'
import { AXIOS_INSTANCE } from '@/lib/httpClient'
import type { ReportRequestDto, ReportsControllerDownloadLiveParams } from '@/lib/types/wms-api'

export const REPORT_TYPES = [
  'STOCK_ON_HAND',
  'MOVEMENT_HISTORY',
  'VELOCITY_ABC',
  'AGING_ANALYSIS',
  'DAILY_KPI',
  'LOCATION_UTILIZATION',
] as const

export const FORMATS = ['CSV', 'XLSX'] as const

export type ReportType = (typeof REPORT_TYPES)[number]
export type ReportFormat = (typeof FORMATS)[number]

export interface ReportJob {
  jobId: string
  reportType: string
  status: string
  createdAt?: string
  completedAt?: string
  format?: string
  parameters?: Record<string, unknown>
  error?: string
  downloadUrl?: string
}

function extractJobId(res: unknown): string | null {
  if (!res) return null
  if (typeof res === 'string') return res
  const obj = res as Record<string, unknown>
  if (obj.jobId && typeof obj.jobId === 'string') return obj.jobId
  if (obj.data && typeof obj.data === 'object') {
    const d = obj.data as Record<string, unknown>
    if (typeof d.jobId === 'string') return d.jobId
  }
  if (obj.id && typeof obj.id === 'string') return obj.id
  return null
}

let recentJobs: ReportJob[] = []

export function getRecentJobs(): ReportJob[] {
  return [...recentJobs]
}

export function addRecentJob(job: ReportJob) {
  recentJobs = [job, ...recentJobs.filter((j) => j.jobId !== job.jobId)].slice(0, 50)
}

export function updateRecentJob(jobId: string, patch: Partial<ReportJob>) {
  recentJobs = recentJobs.map((j) => (j.jobId === jobId ? { ...j, ...patch } : j))
}

export function useRequestReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: ReportRequestDto) => {
      const res = await ReportsController_requestReport(dto)
      const jobId = extractJobId(res) || `temp-${Date.now()}`
      const newJob: ReportJob = {
        jobId,
        reportType: dto.reportType,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        parameters: dto.parameters as Record<string, unknown> | undefined,
      }
      addRecentJob(newJob)
      return { jobId, raw: res }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'reports'] })
    },
  })
}

export function useReportStatus(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['wms', 'reports', 'status', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const res = await ReportsController_getStatus(jobId)
      const data = (res ?? {}) as Record<string, unknown>
      const nestedData = data.data as Record<string, unknown> | undefined
      const status = String(data.status || nestedData?.status || 'UNKNOWN')
      const patch: Partial<ReportJob> = {
        status,
        completedAt: String(data.completedAt || nestedData?.completedAt || ''),
        error: String(data.error || nestedData?.error || ''),
      }
      updateRecentJob(jobId, patch)
      return { jobId, status, raw: res }
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'PENDING' || s === 'PROCESSING' ? 4000 : false
    },
    staleTime: 0,
  })
}

export async function downloadCompletedReport(jobId: string): Promise<void> {
  const url = getReportsControllerDownloadCompletedUrl(jobId)
  const response = await AXIOS_INSTANCE.get(url, { responseType: 'blob' })
  const blob = response.data as Blob
  const contentType = String(response.headers?.['content-type'] || '')
  const ext =
    contentType.includes('excel') || contentType.includes('spreadsheet') ? 'xlsx' : 'csv'
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `report-${jobId}.${ext}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(link.href)
}

export async function downloadLiveReport(params: ReportsControllerDownloadLiveParams) {
  const url = getReportsControllerDownloadLiveUrl(params)
  const response = await AXIOS_INSTANCE.get(url, { responseType: 'blob' })
  const blob = response.data as Blob
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `report-live-${params.reportType}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(link.href)
}

export async function downloadTemplate(reportType: string): Promise<void> {
  const url = getReportsControllerGetTemplateUrl(reportType)
  const response = await AXIOS_INSTANCE.get(url, { responseType: 'blob' })
  const blob = response.data as Blob
  const contentType = String(response.headers?.['content-type'] || '')
  const ext = contentType.includes('excel') || contentType.includes('spreadsheet') ? 'xlsx' : 'csv'
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = `template-${reportType}.${ext}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(link.href)
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      return downloadCompletedReport(jobId)
    },
  })
}

export function useDownloadLiveReport() {
  return useMutation({
    mutationFn: async (params: ReportsControllerDownloadLiveParams) => {
      return downloadLiveReport(params)
    },
  })
}


