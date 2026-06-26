import { useMemo } from 'react'
import { CalendarDays, User, Clock, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useInspectionEvents, type InspectionEvent } from '@/features/quality/inspections/data/inspection-queries'

const EVENT_TYPE_BADGE: Record<string, string> = {
  CREATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ASSIGNED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  STARTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RESULT_RECORDED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  REOPENED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

interface Props {
  inspectionId: string
}

export function InspectionEventsPanel({ inspectionId }: Props) {
  const { data: events, isLoading } = useInspectionEvents(inspectionId)

  const sorted = useMemo(() => {
    if (!events) return []
    return [...events].sort(
      (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    )
  }, [events])

  if (isLoading) {
    return <div className='space-y-3'>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className='h-16 w-full' />)}</div>
  }

  if (!sorted.length) {
    return (
      <div className='flex flex-col items-center gap-3 py-8 text-center'>
        <History className='h-8 w-8 text-muted-foreground/30' />
        <p className='text-sm text-muted-foreground'>No events recorded yet</p>
      </div>
    )
  }

  return (
    <div className='space-y-0'>
      {sorted.map((event, idx) => (
        <div key={event.id} className='relative flex gap-4 pb-6 last:pb-0'>
          {idx < sorted.length - 1 && (
            <div className='absolute left-[11px] top-6 h-full w-px bg-border' />
          )}
          <div className='relative mt-1.5 h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30 bg-background' />
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Badge variant='outline' className={`text-xs ${EVENT_TYPE_BADGE[event.eventType] || ''}`}>
                {event.eventType.replace(/_/g, ' ')}
              </Badge>
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Clock className='h-3 w-3' />
                {new Date(event.performedAt).toLocaleString()}
              </span>
            </div>
            {event.performedBy && (
              <span className='flex items-center gap-1 mt-1 text-xs text-muted-foreground'>
                <User className='h-3 w-3' />
                {event.performedBy}
              </span>
            )}
            {event.notes && (
              <p className='mt-1 text-sm text-muted-foreground'>{event.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
