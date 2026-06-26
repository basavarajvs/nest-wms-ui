import { Code, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useEvent } from '../data/audit-log-queries'

interface EventDetailDialogProps {
  eventId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SourceBadge({ source }: { source: string }) {
  const s = (source || '').toUpperCase()
  const map: Record<string, string> = {
    WEB: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    RF: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    INTEGRATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    SYSTEM: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  }
  return (
    <Badge className={map[s] ?? ''} variant='outline'>
      {s || 'UNKNOWN'}
    </Badge>
  )
}

export function EventDetailDialog({ eventId, open, onOpenChange }: EventDetailDialogProps) {
  const { data: event, isLoading } = useEvent(eventId)
  const [copied, setCopied] = useState(false)

  const eventData = event?.eventData
  const eventDataJson = eventData
    ? JSON.stringify(eventData, null, 2)
    : null

  const handleCopy = async () => {
    if (!eventDataJson) return
    try {
      await navigator.clipboard.writeText(eventDataJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may not be available
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Code className='h-5 w-5' />
            Event Detail
          </DialogTitle>
          <DialogDescription>
            {event?.id ? `Event ${event.id.slice(0, 8)}...` : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-8 text-muted-foreground'>
            Loading event...
          </div>
        ) : event ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-muted-foreground'>Event Type</span>
                <p className='font-medium'>{event.eventType}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>Source</span>
                <div className='mt-0.5'>
                  <SourceBadge source={event.source} />
                </div>
              </div>
              <div>
                <span className='text-muted-foreground'>Entity Type</span>
                <p className='font-medium'>{event.entityType}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>Entity ID</span>
                <p className='font-mono text-xs'>{event.entityId}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>Performed By</span>
                <p className='font-medium'>{event.performedBy || '-'}</p>
              </div>
              <div>
                <span className='text-muted-foreground'>Occurred At</span>
                <p className='font-mono text-xs'>
                  {event.occurredAt
                    ? new Date(event.occurredAt).toLocaleString()
                    : '-'}
                </p>
              </div>
              {event.description && (
                <div className='col-span-2'>
                  <span className='text-muted-foreground'>Description</span>
                  <p className='mt-0.5 text-sm'>{event.description}</p>
                </div>
              )}
            </div>

            {eventDataJson && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Event Data</span>
                  <Button variant='ghost' size='sm' onClick={handleCopy}>
                    {copied ? (
                      <Check className='mr-1 h-3 w-3 text-green-600' />
                    ) : (
                      <Copy className='mr-1 h-3 w-3' />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <pre className='max-h-64 overflow-auto rounded-lg border bg-muted p-4 text-xs font-mono whitespace-pre-wrap break-all'>
                  {eventDataJson}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className='py-8 text-center text-muted-foreground'>
            Event not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
