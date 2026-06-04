import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { useStockLevels } from '@/features/inventory/stock/data/stock-queries'

export function AnalyticsChart() {
  const { data, isLoading, isError, error } = useStockLevels({})

  const chartData = useMemo(() => {
    if (!data?.levels?.length) return []

    const totalOnHand = data.levels.reduce(
      (sum, l) => sum + (l.onHand ?? 0),
      0
    )
    const totalAllocated = data.levels.reduce(
      (sum, l) => sum + (l.allocated ?? 0),
      0
    )
    const totalReserved = data.levels.reduce(
      (sum, l) => sum + (l.reserved ?? 0),
      0
    )
    const totalAvailable = data.levels.reduce(
      (sum, l) => sum + (l.available ?? 0),
      0
    )

    return [
      { name: 'On Hand', total: totalOnHand },
      { name: 'Allocated', total: totalAllocated },
      { name: 'Reserved', total: totalReserved },
      { name: 'Available', total: totalAvailable },
    ]
  }, [data])

  if (isLoading) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <Skeleton className='h-[260px] w-full' />
      </div>
    )
  }

  if (isError) {
    return (
      <div className='flex h-[300px] items-center justify-center text-sm text-destructive'>
        {(error as any)?.message || 'Failed to load inventory data'}
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>
        No inventory data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={chartData}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            fontSize: 13,
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          formatter={(value: number) => [value.toLocaleString(), 'Units']}
        />
        <Area
          type='monotone'
          dataKey='total'
          stroke='currentColor'
          className='text-primary'
          fill='currentColor'
          fillOpacity={0.15}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
