import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useRecentOrders,
  type RecentOrder,
} from '../data/dashboard-queries'

function groupOrdersByMonth(orders: RecentOrder[]): { name: string; total: number }[] {
  if (!orders.length) return []

  const monthMap: Record<string, number> = {}

  for (const order of orders) {
    if (!order.createdAt) continue
    try {
      const date = new Date(order.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = (monthMap[key] ?? 0) + 1
    } catch {
      // skip unparseable dates
    }
  }

  const sortedKeys = Object.keys(monthMap).sort()
  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
  }

  return sortedKeys.map((key) => {
    const monthNum = key.split('-')[1]
    return {
      name: monthLabels[monthNum] || monthNum,
      total: monthMap[key],
    }
  })
}

export function Overview() {
  const { data: orders, isLoading, isError, error } = useRecentOrders()

  const chartData = useMemo(
    () => groupOrdersByMonth(orders ?? []),
    [orders]
  )

  if (isLoading) {
    return (
      <div className='flex h-[350px] items-center justify-center'>
        <Skeleton className='h-[300px] w-full' />
      </div>
    )
  }

  if (isError) {
    return (
      <div className='flex h-[350px] items-center justify-center text-sm text-destructive'>
        {(error as any)?.message || 'Failed to load order data'}
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className='flex h-[350px] items-center justify-center text-sm text-muted-foreground'>
        No order data available for chart
      </div>
    )
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={chartData}>
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
          formatter={(value: number) => [value, 'Orders']}
        />
        <Bar
          dataKey='total'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
