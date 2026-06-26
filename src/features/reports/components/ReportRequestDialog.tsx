import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportRequestDto } from '@/lib/types/wms-api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  REPORT_TYPES,
  FORMATS,
  useRequestReport,
  downloadTemplate,
} from '../data/report-queries'

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

interface ReportRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReportRequestDialog({ open, onOpenChange, onSuccess }: ReportRequestDialogProps) {
  const requestMutation = useRequestReport()

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

  const onSubmit = async (formData: ReportForm) => {
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
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request report'
      toast.error(msg)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate(watchedReportType)
      toast.success(`Template downloaded for ${watchedReportType}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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

            <div className='flex items-center justify-between border-t pt-2'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleDownloadTemplate}
              >
                <Download className='mr-1 h-3 w-3' />
                Download Template
              </Button>
              <div className='text-xs text-muted-foreground'>
                Live (immediate) download also available — no queuing.
              </div>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={requestMutation.isPending}>
                {requestMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Requesting...
                  </>
                ) : (
                  'Request Report'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
