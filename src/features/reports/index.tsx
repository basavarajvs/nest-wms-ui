import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Download, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportsControllerDownloadLiveParams } from '@/lib/types/wms-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useReportStatus,
  downloadCompletedReport,
  downloadLiveReport,
  getRecentJobs,
  REPORT_TYPES,
  type ReportJob,
} from './data/report-queries'
import { ReportRequestDialog } from './components/ReportRequestDialog'

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase()
  if (s === 'COMPLETED') return <Badge className='bg-green-600'>COMPLETED</Badge>
  if (s === 'PROCESSING') return <Badge variant='secondary'>PROCESSING</Badge>
  if (s === 'PENDING') return <Badge variant='outline'>PENDING</Badge>
  if (s === 'FAILED') return <Badge variant='destructive'>FAILED</Badge>
  return <Badge variant='outline'>{s || '—'}</Badge>
}

export function Reports() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [jobs, setJobs] = useState<ReportJob[]>(getRecentJobs())

  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(getRecentJobs())
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setJobs(getRecentJobs())
  }, [])

  const filteredJobs = jobs
    .filter((j) => {
      if (statusFilter && j.status.toUpperCase() !== statusFilter.toUpperCase()) return false
      if (typeFilter && j.reportType !== typeFilter) return false
      return true
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  const total = filteredJobs.length
  const paginated = filteredJobs.slice((page - 1) * limit, page * limit)

  const activeJobs = jobs.filter((j) =>
    ['PENDING', 'PROCESSING'].includes((j.status || '').toUpperCase())
  )

  const handleDownload = async (job: ReportJob) => {
    if (job.status.toUpperCase() !== 'COMPLETED') return
    try {
      await downloadCompletedReport(job.jobId)
      toast.success(`Download started for ${job.jobId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      toast.error(msg)
    }
  }

  const handleLiveDownload = async () => {
    try {
      const params: ReportsControllerDownloadLiveParams = {
        reportType: 'STOCK_ON_HAND',
        dateFrom: '',
        dateTo: '',
        facilityId: '',
        zoneId: '',
        productClass: '',
        format: 'CSV',
        timezone: 'UTC',
        liveQuery: 'true',
      }
      await downloadLiveReport(params)
      toast.success('Live report download started')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Live download failed'
      toast.error(msg)
    }
  }

  const refresh = () => {
    setJobs(getRecentJobs())
    toast.info('Refreshed local report jobs')
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Reports</h1>
          <p className='text-muted-foreground'>
            Request async reports (Stock, Movement, ABC, Aging, KPI, Utilization) and download when ready.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={refresh}>
            <RefreshCw className='mr-2 h-4 w-4' /> Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Request New Report
          </Button>

          <ReportRequestDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setJobs(getRecentJobs())
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <FileText className='h-4 w-4' /> Live Report Download (no queue)
          </CardTitle>
          <CardDescription>
            Direct streaming download for supported report types. Downloads immediately without queuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant='secondary' onClick={handleLiveDownload}>
            <Download className='mr-2 h-4 w-4' /> Download Live
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-end gap-4'>
            <div>
              <Label>Status</Label>
              <Select
                value={statusFilter || 'all_statuses'}
                onValueChange={(v) => { setStatusFilter(v === 'all_statuses' ? '' : v); setPage(1) }}
              >
                <SelectTrigger className='w-44'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all_statuses'>All</SelectItem>
                  <SelectItem value='PENDING'>PENDING</SelectItem>
                  <SelectItem value='PROCESSING'>PROCESSING</SelectItem>
                  <SelectItem value='COMPLETED'>COMPLETED</SelectItem>
                  <SelectItem value='FAILED'>FAILED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={typeFilter || 'all_types'}
                onValueChange={(v) => { setTypeFilter(v === 'all_types' ? '' : v); setPage(1) }}
              >
                <SelectTrigger className='w-52'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all_types'>All Types</SelectItem>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant='outline'
              onClick={() => { setStatusFilter(''); setTypeFilter(''); setPage(1) }}
            >
              Clear Filters
            </Button>
            <div className='ml-auto text-sm text-muted-foreground'>
              Showing local session jobs only
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Jobs ({total})</CardTitle>
          <CardDescription>
            Jobs requested in this browser session. Status auto-polls while PENDING/PROCESSING.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <FileText className='h-12 w-12 text-muted-foreground/30' />
              <p className='text-muted-foreground'>No reports requested yet in this session</p>
              <p className='text-sm text-muted-foreground max-w-md'>
                Use "Request New Report" to generate Stock, Movement, ABC, Aging, KPI, or Utilization reports.
              </p>
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='py-8 text-center text-muted-foreground'>
                        <div className='flex flex-col items-center gap-2'>
                          <AlertCircle className='h-5 w-5' />
                          <p>No jobs match the current filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((job) => (
                      <ReportRow key={job.jobId} job={job} onDownload={handleDownload} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {total > limit && (
            <div className='mt-4 flex items-center justify-end gap-2 text-sm'>
              <Button variant='outline' size='sm' disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <span>Page {page} / {Math.ceil(total / limit)}</span>
              <Button variant='outline' size='sm' disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {activeJobs.map((j) => (
        <StatusPoller key={j.jobId} jobId={j.jobId} />
      ))}
    </div>
  )
}

function StatusPoller({ jobId }: { jobId: string }) {
  useReportStatus(jobId, true)
  return null
}

function ReportRow({ job, onDownload }: { job: ReportJob; onDownload: (j: ReportJob) => void }) {
  return (
    <TableRow>
      <TableCell className='font-mono text-xs'>{job.jobId}</TableCell>
      <TableCell className='text-sm'>{job.reportType}</TableCell>
      <TableCell><StatusBadge status={job.status} /></TableCell>
      <TableCell className='text-xs text-muted-foreground'>
        {job.createdAt ? new Date(job.createdAt).toLocaleString() : '—'}
      </TableCell>
      <TableCell className='text-xs text-muted-foreground'>
        {job.completedAt ? new Date(job.completedAt).toLocaleString() : '—'}
      </TableCell>
      <TableCell className='text-right'>
        <Button
          size='sm'
          variant='outline'
          disabled={job.status.toUpperCase() !== 'COMPLETED'}
          onClick={() => onDownload(job)}
        >
          <Download className='mr-1 h-3 w-3' /> Download
        </Button>
      </TableCell>
    </TableRow>
  )
}
