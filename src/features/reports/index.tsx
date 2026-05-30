import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, RefreshCw, Download, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportRequestDto, ReportsControllerDownloadLiveParams } from '@/lib/types/wms-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DatePicker } from '@/components/date-picker'
import {
  useRequestReport,
  useReportStatus,
  downloadCompletedReport,
  downloadLiveReport,
  getRecentJobs,
  type ReportJob,
} from './data/report-queries'

const REPORT_TYPES = [
  'STOCK_ON_HAND',
  'MOVEMENT_HISTORY',
  'VELOCITY_ABC',
  'AGING_ANALYSIS',
  'DAILY_KPI',
  'LOCATION_UTILIZATION',
] as const

const FORMATS = ['CSV', 'XLSX'] as const

const reportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  format: z.enum(FORMATS).default('CSV'),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  facilityId: z.string().optional(),
  productClass: z.string().optional(),
  timezone: z.string().optional(),
})

type ReportForm = z.infer<typeof reportSchema>

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
  const requestMutation = useRequestReport()

  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(getRecentJobs())
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setJobs(getRecentJobs())
  }, [])

  const form = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: 'STOCK_ON_HAND',
      format: 'CSV',
      facilityId: '',
      productClass: '',
      timezone: 'UTC',
    },
  })

  const watchedReportType = form.watch('reportType')
  const watchedDateFrom = form.watch('dateFrom')
  const watchedDateTo = form.watch('dateTo')

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

  const onRequest = async (formData: ReportForm) => {
    try {
      const dto: ReportRequestDto = {
        reportType: formData.reportType,
        parameters: {
          dateFrom: formData.dateFrom ? formData.dateFrom.toISOString() : undefined,
          dateTo: formData.dateTo ? formData.dateTo.toISOString() : undefined,
          facilityId: formData.facilityId || undefined,
          productClass: formData.productClass || undefined,
          timezone: formData.timezone || 'UTC',
        },
      }
      const result = await requestMutation.mutateAsync(dto)
      toast.success(`Report requested: ${formData.reportType} (job ${result.jobId})`)
      setDialogOpen(false)
      form.reset()
      setJobs(getRecentJobs())
      setPage(1)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request report'
      toast.error(msg)
    }
  }

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
        reportType: watchedReportType || 'STOCK_ON_HAND',
        dateFrom: watchedDateFrom?.toISOString() ?? '',
        dateTo: watchedDateTo?.toISOString() ?? '',
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Request New Report
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-lg'>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onRequest)} className='space-y-4'>
                  <DialogHeader>
                    <DialogTitle>Request New Report</DialogTitle>
                    <DialogDescription>
                      Submit a report generation job. Status polls automatically.
                    </DialogDescription>
                  </DialogHeader>

                  <FormField
                    control={form.control}
                    name='reportType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select report type' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REPORT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='dateFrom'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>Date From</FormLabel>
                          <FormControl>
                            <DatePicker selected={field.value} onSelect={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='dateTo'
                      render={({ field }) => (
                        <FormItem className='flex flex-col'>
                          <FormLabel>Date To</FormLabel>
                          <FormControl>
                            <DatePicker selected={field.value} onSelect={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='format'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Format</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FORMATS.map((f) => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='facilityId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facility ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder='optional' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='productClass'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Class</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='optional (e.g. A, B, C)' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='timezone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type='submit' disabled={requestMutation.isPending}>
                      {requestMutation.isPending ? 'Requesting...' : 'Request Report'}
                    </Button>
                  </DialogFooter>

                  <div className='border-t pt-2 text-xs text-muted-foreground'>
                    Live (immediate) download available below for supported types — no queuing.
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <FileText className='h-4 w-4' /> Live Report Download (no queue)
          </CardTitle>
          <CardDescription>
            Direct streaming download for supported report types (uses current form values if open).
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
