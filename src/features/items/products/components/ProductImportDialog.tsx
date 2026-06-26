import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  useUploadImport,
  useImportStatus,
  downloadImportErrors,
} from '../data/product-queries'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductImportDialog({ open, onOpenChange }: ProductImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadImport()
  const { data: importStatus } = useImportStatus(jobId)

  const statusData = (importStatus ?? {}) as Record<string, unknown>
  const nestedData = statusData.data as Record<string, unknown> | undefined
  const jobStatus = String(statusData.status || nestedData?.status || '').toUpperCase()
  const errorCount = Number(statusData.errorCount ?? nestedData?.errorCount ?? 0)
  const totalRows = Number(statusData.totalRows ?? nestedData?.totalRows ?? 0)

  const isPolling = jobStatus === 'PENDING' || jobStatus === 'PROCESSING'

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith('.csv') || dropped.name.endsWith('.xlsx'))) {
      setFile(dropped)
    } else {
      toast.error('Please drop a CSV or XLSX file')
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return
    try {
      const res = await uploadMutation.mutateAsync(file)
      const resData = (res ?? {}) as Record<string, unknown>
      const extractedId = String(resData.jobId || (resData.data as Record<string, unknown> | undefined)?.jobId || '')
      if (extractedId) {
        setJobId(extractedId)
        toast.success('Import started')
      } else {
        toast.success('Import complete')
        onOpenChange(false)
        setFile(null)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast.error(msg)
    }
  }

  const handleDownloadErrors = async () => {
    if (!jobId) return
    try {
      await downloadImportErrors(jobId)
      toast.success('Error CSV downloaded')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      toast.error(msg)
    }
  }

  const handleClose = () => {
    if (isPolling) return
    onOpenChange(false)
    setFile(null)
    setJobId(null)
  }

  const handleReset = () => {
    setFile(null)
    setJobId(null)
  }

  const acceptedTypes = '.csv,.xlsx'
  const maxSize = 10 * 1024 * 1024

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV or XLSX file to bulk-create products.
          </DialogDescription>
        </DialogHeader>

        {!jobId ? (
          <div className='space-y-4'>
            <div
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/30 hover:border-muted-foreground/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {file ? (
                <div className='flex items-center gap-3'>
                  <File className='h-8 w-8 text-primary' />
                  <div className='text-sm'>
                    <p className='font-medium'>{file.name}</p>
                    <p className='text-muted-foreground'>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='shrink-0'
                    onClick={() => setFile(null)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className='h-10 w-10 text-muted-foreground/50' />
                  <div className='text-center text-sm'>
                    <p className='font-medium'>
                      Drop your file here, or{' '}
                      <button
                        type='button'
                        className='text-primary underline underline-offset-4'
                        onClick={() => inputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className='mt-1 text-muted-foreground'>
                      CSV or XLSX up to 10 MB
                    </p>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                type='file'
                accept={acceptedTypes}
                className='hidden'
                onChange={(e) => {
                  const selected = e.target.files?.[0]
                  if (selected) {
                    if (selected.size > maxSize) {
                      toast.error('File exceeds 10 MB limit')
                      return
                    }
                    setFile(selected)
                  }
                }}
              />
            </div>

            {uploadMutation.isPending && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Uploading...
              </div>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='rounded-lg border p-4'>
              {isPolling && (
                <div className='flex items-center gap-3'>
                  <Loader2 className='h-5 w-5 animate-spin text-primary' />
                  <div>
                    <p className='text-sm font-medium'>Processing import...</p>
                    <p className='text-xs text-muted-foreground'>
                      Job {jobId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              )}
              {jobStatus === 'COMPLETED' && (
                <div className='flex items-center gap-3'>
                  <CheckCircle2 className='h-5 w-5 text-green-600' />
                  <div>
                    <p className='text-sm font-medium text-green-600'>Import complete</p>
                    <p className='text-xs text-muted-foreground'>
                      {totalRows} rows processed
                      {errorCount > 0 && `, ${errorCount} errors`}
                    </p>
                  </div>
                </div>
              )}
              {jobStatus === 'FAILED' && (
                <div className='flex items-center gap-3'>
                  <AlertCircle className='h-5 w-5 text-destructive' />
                  <div>
                    <p className='text-sm font-medium text-destructive'>Import failed</p>
                    <p className='text-xs text-muted-foreground'>
                      {String(nestedData?.error || statusData.error || 'Unknown error')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errorCount > 0 && (
              <div className='flex items-center justify-between rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/20'>
                <div className='flex items-center gap-2 text-sm'>
                  <AlertCircle className='h-4 w-4 text-amber-600' />
                  <span>
                    <Badge variant='outline' className='mr-1'>{errorCount}</Badge>
                    rows with errors
                  </span>
                </div>
                <Button variant='outline' size='sm' onClick={handleDownloadErrors}>
                  <Download className='mr-1 h-3 w-3' /> Errors CSV
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!jobId ? (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className='mr-2 h-4 w-4' />
                    Upload & Import
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {!isPolling && (
                <>
                  <Button variant='outline' onClick={handleReset}>
                    Import Another
                  </Button>
                  <Button onClick={() => { onOpenChange(false); setFile(null); setJobId(null) }}>
                    Done
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
