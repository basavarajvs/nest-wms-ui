import { Box, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useSessionContainers,
  useSealContainer,
} from '../data/packing-queries'
import { CONTAINER_STATUS_BADGE } from '../data/packing-schemas'

interface SessionContainersPanelProps {
  sessionId: string
  onScanItem: () => void
}

export function SessionContainersPanel({ sessionId, onScanItem }: SessionContainersPanelProps) {
  const { data: containers, isLoading } = useSessionContainers(sessionId)
  const sealContainer = useSealContainer()

  const handleSeal = async (containerId: string) => {
    try {
      await sealContainer.mutateAsync({ sessionId, dto: { containerId } })
      toast.success('Container sealed')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to seal container')
    }
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center justify-between text-base'>
          <span className='flex items-center gap-2'>
            <Box className='h-4 w-4' />
            Containers ({containers?.length || 0})
          </span>
          <Button size='sm' onClick={onScanItem}>
            Scan Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-14 w-full' />
            ))}
          </div>
        ) : !containers || containers.length === 0 ? (
          <p className='py-4 text-center text-sm text-muted-foreground'>
            No containers yet. Scan an item to create one.
          </p>
        ) : (
          <div className='space-y-2'>
            {containers.map((c) => (
              <div
                key={c.id}
                className='flex items-center justify-between rounded-md border px-3 py-2'
              >
                <div className='flex items-center gap-3'>
                  <Box className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>
                      {c.containerCode || c.id.substring(0, 12)}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {c.items || 0} items{c.weight ? ` | ${c.weight} kg` : ''}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant={CONTAINER_STATUS_BADGE[c.status || ''] || 'secondary'}>
                    {c.status || 'open'}
                  </Badge>
                  {c.status !== 'sealed' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleSeal(c.id)}
                      disabled={sealContainer.isPending}
                    >
                      <CheckCircle2 className='mr-1 h-3 w-3' />
                      Seal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
