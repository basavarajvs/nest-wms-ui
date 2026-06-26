import { useState } from 'react'
import {
  RefreshCw,
  BarChart3,
  ClipboardCheck,
  Target,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCountMetrics,
  type CountMetrics,
} from '@/features/counts/data/count-metrics-queries'
import { useFacility } from '@/hooks/useFacility'

interface StatCardProps {
  title: string
  value: string | number | undefined | null
  description?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  isLoading?: boolean
}

function StatCard({ title, value, description, icon, trend, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-8 w-20' />
        ) : (
          <div className='flex items-baseline gap-2'>
            <span className='text-2xl font-bold'>
              {value ?? '—'}
            </span>
            {trend === 'up' && <TrendingUp className='h-4 w-4 text-green-500' />}
            {trend === 'down' && <TrendingDown className='h-4 w-4 text-red-500' />}
          </div>
        )}
        {description && (
          <p className='text-xs text-muted-foreground mt-1'>{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function CountMetricsPage() {
  const { selectedFacility } = useFacility()
  const { data: metrics, isLoading, isError, error, refetch, isFetching } = useCountMetrics({
    facilityId: selectedFacility?.id || undefined,
  })

  const m = metrics as CountMetrics | undefined
  const accuracyPct = m?.accuracyRate !== undefined ? `${(m.accuracyRate * 100).toFixed(1)}%` : undefined

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Count Metrics</h1>
          <p className='text-muted-foreground'>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </p>
        </div>
        <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isError ? (
        <Card>
          <CardContent className='flex flex-col items-center gap-4 py-12 text-center'>
            <AlertCircle className='h-10 w-10 text-muted-foreground' />
            <div>
              <p className='font-medium text-destructive'>Failed to load metrics</p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <StatCard
            title='Total Lines'
            value={m?.totalLines}
            icon={<ClipboardCheck className='h-4 w-4 text-muted-foreground' />}
            isLoading={isLoading}
          />
          <StatCard
            title='Counted Lines'
            value={m?.countedLines}
            icon={<BarChart3 className='h-4 w-4 text-muted-foreground' />}
            isLoading={isLoading}
          />
          <StatCard
            title='Accuracy Rate'
            value={accuracyPct}
            icon={<Target className='h-4 w-4 text-muted-foreground' />}
            trend={m?.accuracyRate !== undefined && m.accuracyRate >= 0.95 ? 'up' : m?.accuracyRate !== undefined && m.accuracyRate < 0.8 ? 'down' : undefined}
            isLoading={isLoading}
          />
          <StatCard
            title='Zero Variance'
            value={m?.zeroVarianceLines}
            icon={<CheckCircle2 className='h-4 w-4 text-muted-foreground' />}
            trend='neutral'
            isLoading={isLoading}
          />
          <StatCard
            title='Positive Variance'
            value={m?.positiveVarianceLines}
            description='System under-counted vs physical'
            icon={<TrendingUp className='h-4 w-4 text-muted-foreground' />}
            trend='up'
            isLoading={isLoading}
          />
          <StatCard
            title='Negative Variance'
            value={m?.negativeVarianceLines}
            description='System over-counted vs physical'
            icon={<TrendingDown className='h-4 w-4 text-muted-foreground' />}
            trend='down'
            isLoading={isLoading}
          />
        </div>
      )}

      {m?.computedAt && (
        <p className='text-xs text-muted-foreground text-right'>
          Last computed: {new Date(m.computedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
