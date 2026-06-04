import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  RefreshCw,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileWarning,
  BarChart3,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useQualityInspections,
  type QualityInspection,
} from '@/features/quality/data/quality-queries'
import { useNcrs, type Ncr } from '@/features/ncr/data/ncr-queries'
import { QcInspectionDetailDialog } from '@/features/quality/components/QcInspectionDetailDialog'

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant='outline'>—</Badge>
  const pair: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
    Critical: { variant: 'destructive' },
    Major: { variant: 'outline', className: 'border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:bg-orange-950/30' },
    Minor: { variant: 'secondary' },
    Observation: { variant: 'default' },
  }
  const { variant, className } = pair[severity] || { variant: 'outline' as const }
  return <Badge variant={variant} className={className}>{severity}</Badge>
}

const STATS_CARD_STYLES = {
  pending: {
    label: 'Pending Inspections',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
  },
  completed: {
    label: 'Completed Today',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/50',
  },
  passRate: {
    label: 'Pass Rate',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  openNcrs: {
    label: 'Open NCRs',
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-900/50',
  },
}

const STATS_ICONS: Record<string, typeof ClipboardCheck> = {
  pending: ClipboardCheck,
  completed: CheckCircle2,
  passRate: BarChart3,
  openNcrs: AlertTriangle,
}

function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function QualityDashboardPage() {
  const [pendingSorting, setPendingSorting] = useState<SortingState>([])
  const [ncrSorting, setNcrSorting] = useState<SortingState>([])
  const [detailInspectionId, setDetailInspectionId] = useState<string | null>(null)

  const { data: inspData, isLoading: inspLoading, refetch: refetchInsp } = useQualityInspections({ page: 1, limit: 100 })
  const { data: ncrData, isLoading: ncrLoading, refetch: refetchNcr } = useNcrs()

  const inspections = inspData?.inspections ?? []
  const ncrs = ncrData?.ncrs ?? []

  const stats = useMemo(() => {
    const pending = inspections.filter(
      (i) => (i.status?.toUpperCase() === 'PENDING' || i.qcResult === undefined) && !i.qcResult
    ).length

    const today = todayDateString()
    const completed = inspections.filter((i) => {
      const d = i.inspectedAt || i.createdAt || ''
      return d.startsWith(today) && (i.qcResult === 'PASS' || i.qcResult === 'FAIL')
    }).length

    const withResult = inspections.filter((i) => i.qcResult === 'PASS' || i.qcResult === 'FAIL')
    const passed = inspections.filter((i) => i.qcResult === 'PASS').length
    const passRate = withResult.length > 0 ? Math.round((passed / withResult.length) * 100) : 0

    const openNcrs = ncrs.filter((n) => n.status?.toUpperCase() !== 'CLOSED' && n.status?.toUpperCase() !== 'RESOLVED').length

    return { pending, completed, passRate, openNcrs }
  }, [inspections, ncrs])

  const chartData = useMemo(() => {
    const passed = inspections.filter((i) => i.qcResult === 'PASS').length
    const failed = inspections.filter((i) => i.qcResult === 'FAIL').length
    const pending = inspections.filter(
      (i) => !i.qcResult || i.qcResult === 'PENDING'
    ).length
    const noResult = inspections.length - passed - failed - pending
    return [
      { name: 'Pass', value: passed, fill: 'hsl(var(--success) / 0.8)' },
      { name: 'Fail', value: failed, fill: 'hsl(var(--destructive) / 0.8)' },
      { name: 'Pending', value: pending + Math.max(noResult, 0), fill: 'hsl(var(--warning) / 0.6)' },
    ].filter((d) => d.value > 0)
  }, [inspections])

  const pendingInspections = useMemo(
    () => inspections.filter(
      (i) => (i.status?.toUpperCase() === 'PENDING' || !i.qcResult)
    ).slice(0, 10),
    [inspections]
  )

  const recentNcrs = useMemo(() => {
    const sorted = [...ncrs].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })
    return sorted.slice(0, 5)
  }, [ncrs])

  const pendingColumns: ColumnDef<QualityInspection, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.productName || row.original.productSku || '—'}</span>
        ),
      },
      {
        accessorKey: 'grnLineId',
        header: ({ column }) => <DataTableColumnHeader column={column} title='GRN Line' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.grnLineId?.substring(0, 10)}...</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className='text-right'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setDetailInspectionId(row.original.id)}
            >
              <Eye className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  const pendingTable = useReactTable({
    data: pendingInspections,
    columns: pendingColumns,
    state: { sorting: pendingSorting },
    onSortingChange: setPendingSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const ncrColumns: ColumnDef<Ncr, any>[] = useMemo(
    () => [
      {
        accessorKey: 'ncrName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='NCR' />,
        cell: ({ row }) => (
          <span className='font-medium'>{row.original.ncrName || '—'}</span>
        ),
      },
      {
        accessorKey: 'severity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Severity' />,
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => (
          <Badge variant={row.original.status?.toUpperCase() === 'OPEN' ? 'default' : 'secondary'}>
            {row.original.status || '—'}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : '—'}
          </span>
        ),
      },
    ],
    []
  )

  const ncrTable = useReactTable({
    data: recentNcrs,
    columns: ncrColumns,
    state: { sorting: ncrSorting },
    onSortingChange: setNcrSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const isLoading = inspLoading || ncrLoading

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Quality Dashboard</h1>
          <p className='text-muted-foreground'>
            Quality control overview and quick access to inspections and NCRs
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => { refetchInsp(); refetchNcr() }} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        {(Object.keys(STATS_CARD_STYLES) as (keyof typeof STATS_CARD_STYLES)[]).map((key) => {
          const config = STATS_CARD_STYLES[key]
          const count = stats[key]
          const Icon = STATS_ICONS[key]
          return (
            <Card key={key} className={cn(config.bg, 'border-0')}>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className={cn('text-2xl font-bold', config.text)}>
                      {key === 'passRate' ? `${count}%` : count}
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>{config.label}</p>
                  </div>
                  <div className={cn('rounded-lg p-2', config.iconBg)}>
                    <Icon className={cn('h-5 w-5', config.text)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts + Pending Inspections */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Pass/Fail Chart */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle>Inspection Results</CardTitle>
            <CardDescription>Pass / fail ratio across all inspections</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
                No inspection results yet
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey='name' stroke='#888888' fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke='#888888' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                  />
                  <Bar dataKey='value' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common quality control tasks</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button className='w-full justify-start' variant='outline' asChild>
              <Link to='/inbound/goods-receipt'>
                <ClipboardCheck className='mr-2 h-4 w-4' />
                New Inspection
              </Link>
            </Button>
            <Button className='w-full justify-start' variant='outline' asChild>
              <Link to='/inventory/ncr'>
                <FileWarning className='mr-2 h-4 w-4' />
                New NCR
              </Link>
            </Button>
            <Button className='w-full justify-start' variant='outline' asChild>
              <Link to='/inbound/goods-receipt'>
                <Eye className='mr-2 h-4 w-4' />
                View GRNs Pending QC
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Inspections */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Pending Inspections</CardTitle>
          <CardDescription>
            {pendingInspections.length} inspections awaiting QC
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inspLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : pendingInspections.length === 0 ? (
            <div className='py-8 text-center text-sm text-muted-foreground'>
              No pending inspections
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {pendingTable.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {pendingTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent NCRs */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Recent NCRs</CardTitle>
          <CardDescription>Last 5 non-conformance reports</CardDescription>
        </CardHeader>
        <CardContent>
          {ncrLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : recentNcrs.length === 0 ? (
            <div className='py-8 text-center text-sm text-muted-foreground'>
              No NCRs found
            </div>
          ) : (
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  {ncrTable.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id}>
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {ncrTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {detailInspectionId && (
        <QcInspectionDetailDialog
          inspectionId={detailInspectionId}
          open={!!detailInspectionId}
          onOpenChange={(open) => { if (!open) setDetailInspectionId(null) }}
        />
      )}
    </div>
  )
}
