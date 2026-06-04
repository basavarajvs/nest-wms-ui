import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Camera, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInspectQc } from '../data/quality-queries'

const DEFECT_TYPES = [
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'SHORT', label: 'Short' },
  { value: 'OVER', label: 'Over' },
  { value: 'WRONG_PRODUCT', label: 'Wrong Product' },
  { value: 'EXPIRED', label: 'Expired' },
]

interface QcInspectionDialogProps {
  grnLineId: string
  productName?: string
  productSku?: string
  uom?: string
  expectedQty?: number
  receivedQty?: number
  variance?: string
  varianceType?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function QcInspectionDialog({
  grnLineId,
  productName,
  productSku,
  uom,
  expectedQty,
  receivedQty,
  variance,
  varianceType,
  open,
  onOpenChange,
  onComplete,
}: QcInspectionDialogProps) {
  const [qcResult, setQcResult] = useState<'PASS' | 'FAIL'>('PASS')
  const [sampleSize, setSampleSize] = useState(0)
  const [passCount, setPassCount] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [defectTypes, setDefectTypes] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inspectQc = useInspectQc()

  const handleResultChange = (result: string) => {
    setQcResult(result as 'PASS' | 'FAIL')
  }

  const toggleDefect = (defect: string) => {
    setDefectTypes((prev) =>
      prev.includes(defect) ? prev.filter((d) => d !== defect) : [...prev, defect]
    )
  }

  const handlePhotoUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result
        if (typeof result === 'string') {
          setPhotos((prev) => [...prev, result])
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (sampleSize < 1) {
      toast.error('Sample size must be at least 1.')
      return
    }
    if (qcResult === 'FAIL' && defectTypes.length === 0) {
      toast.error('Please select at least one defect type for a failed result.')
      return
    }
    try {
      await inspectQc.mutateAsync({
        grnLineId,
        qcResult,
        notes: notes || undefined,
      })
      toast.success(`Inspection completed: ${qcResult}`)
      onOpenChange(false)
      onComplete?.()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit inspection')
    }
  }

  const handleClose = () => {
    if (!inspectQc.isPending) {
      setQcResult('PASS')
      setSampleSize(0)
      setPassCount(0)
      setFailCount(0)
      setDefectTypes([])
      setNotes('')
      setPhotos([])
      onOpenChange(false)
    }
  }

  const varianceBadgeVariant = (vt?: string) => {
    if (!vt || vt === 'NONE') return 'outline' as const
    if (vt === 'DAMAGED') return 'destructive' as const
    if (vt === 'SHORT') return 'secondary' as const
    if (vt === 'OVER') return 'default' as const
    return 'outline' as const
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Quality Inspection</DialogTitle>
          <DialogDescription>
            Inspect the selected GRN line and record results.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <Card className='grid grid-cols-2 gap-3 p-4'>
            <div>
              <p className='text-xs text-muted-foreground'>Product</p>
              <p className='text-sm font-medium'>{productName || productSku || '—'}</p>
              {productSku && productName && (
                <p className='text-xs text-muted-foreground'>SKU: {productSku}</p>
              )}
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Variance</p>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>{variance || '—'}</span>
                {varianceType && (
                  <Badge variant={varianceBadgeVariant(varianceType)}>
                    {varianceType}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Expected / Received</p>
              <p className='text-sm font-medium'>
                {expectedQty ?? '—'} / {receivedQty ?? '—'} {uom || ''}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>GRN Line ID</p>
              <p className='font-mono text-xs'>{grnLineId.substring(0, 16)}...</p>
            </div>
          </Card>

          <div className='grid grid-cols-3 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='sampleSize'>Sample Size</Label>
              <Input
                id='sampleSize'
                type='number'
                min={0}
                value={sampleSize || ''}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setSampleSize(val)
                  setPassCount(val)
                }}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='passCount'>Pass Count</Label>
              <Input
                id='passCount'
                type='number'
                min={0}
                max={sampleSize}
                value={passCount}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setPassCount(val)
                  setFailCount(Math.max(0, sampleSize - val))
                }}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='failCount'>Fail Count</Label>
              <Input
                id='failCount'
                type='number'
                min={0}
                max={sampleSize}
                value={failCount}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setFailCount(val)
                  setPassCount(Math.max(0, sampleSize - val))
                  if (val > 0) setQcResult('FAIL')
                  else setQcResult('PASS')
                }}
              />
            </div>
          </div>

          <div className='grid gap-2'>
            <Label>Result</Label>
            <Select value={qcResult} onValueChange={handleResultChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='PASS'>Pass</SelectItem>
                <SelectItem value='FAIL'>Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid gap-2'>
            <Label>Defect Types</Label>
            <div className='flex flex-wrap gap-2'>
              {DEFECT_TYPES.map((dt) => (
                <Badge
                  key={dt.value}
                  variant={defectTypes.includes(dt.value) ? 'default' : 'outline'}
                  className='cursor-pointer'
                  onClick={() => toggleDefect(dt.value)}
                >
                  {dt.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder='Inspection notes (optional)'
            />
          </div>

          <div className='grid gap-2'>
            <Label>Photo Evidence</Label>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={handleFileChange}
            />
            <div className='flex flex-wrap gap-2'>
              {photos.map((photo, i) => (
                <div key={i} className='relative h-16 w-16 overflow-hidden rounded-md border'>
                  <img
                    src={photo}
                    alt={`Evidence ${i + 1}`}
                    className='h-full w-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => removePhoto(i)}
                    className='absolute right-0 top-0 rounded-bl-md bg-background/80 p-0.5'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                className='h-16 w-16'
                onClick={handlePhotoUpload}
              >
                <Camera className='h-5 w-5 text-muted-foreground' />
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Photos are stored locally. Backend upload integration is pending.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={inspectQc.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={inspectQc.isPending}>
            {inspectQc.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Complete Inspection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
