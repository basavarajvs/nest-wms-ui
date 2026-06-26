import { History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusTimeline } from '@/components/StatusTimeline'
import { useSessionHistory } from '../data/packing-queries'

interface SessionHistoryPanelProps {
  sessionId: string
}

export function SessionHistoryPanel({ sessionId }: SessionHistoryPanelProps) {
  const { data: history, isLoading } = useSessionHistory(sessionId)

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <History className='h-4 w-4' />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StatusTimeline
          entries={history || []}
          loading={isLoading}
          emptyMessage='No status history available for this session.'
        />
      </CardContent>
    </Card>
  )
}
