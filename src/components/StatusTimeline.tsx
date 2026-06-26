import { CheckCircle2, Clock, XCircle } from 'lucide-react'

export interface TimelineEntry {
  id?: string
  fromStatus?: string
  toStatus?: string
  changedBy?: string
  changedAt?: string
  notes?: string
}

interface StatusTimelineProps {
  entries: TimelineEntry[]
  loading?: boolean
  emptyMessage?: string
}

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  active: Clock,
  closed: CheckCircle2,
  cancelled: XCircle,
  sealed: CheckCircle2,
}

export function StatusTimeline({ entries, loading, emptyMessage = 'No history available' }: StatusTimelineProps) {
  if (loading) {
    return (
      <div className='space-y-2'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex animate-pulse items-center gap-3 rounded-md border px-3 py-2'>
            <div className='h-2 w-2 rounded-full bg-muted-foreground/30' />
            <div className='h-4 flex-1 rounded bg-muted-foreground/20' />
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return <p className='py-4 text-center text-sm text-muted-foreground'>{emptyMessage}</p>
  }

  return (
    <div className='space-y-1'>
      {entries.map((entry, idx) => {
        const Icon = STATUS_ICON[entry.toStatus || ''] || Clock
        const isLatest = idx === 0
        return (
          <div key={entry.id || idx} className='relative flex gap-3 pb-3'>
            <div className='flex flex-col items-center'>
              <div className={`z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                isLatest
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/30 bg-background'
              }`}>
                <Icon className={`h-3 w-3 ${
                  isLatest ? 'text-primary' : 'text-muted-foreground/50'
                }`} />
              </div>
              {idx < entries.length - 1 && (
                <div className='mt-0 h-full w-px bg-border' />
              )}
            </div>
            <div className={`flex-1 rounded-md border p-2 ${isLatest ? 'bg-muted/30' : ''}`}>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-medium'>
                  {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : entry.toStatus || 'Status change'}
                </p>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : '—'}
                </span>
              </div>
              {(entry.changedBy || entry.notes) && (
                <div className='mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground'>
                  {entry.changedBy && <span>by {entry.changedBy}</span>}
                  {entry.notes && <span>{entry.notes}</span>}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
