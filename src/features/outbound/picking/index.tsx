import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFacility } from '@/hooks/useFacility'
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Package,
  Barcode,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table/pagination'
import { usePickTasks, useConfirmPick, type PickTask } from './data/picking-queries'

const scanSchema = z.object({
  taskId: z.string().min(1),
  locationScan: z.string().min(1, 'Scan the location barcode'),
  productScan: z.string().min(1, 'Scan the product barcode'),
  lotNumber: z.string().optional(),
  exceptionNotes: z.string().optional(),
})

type ScanForm = z.infer<typeof scanSchema>

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  exception: 'bg-red-100 text-red-700',
}

export function PickingConsole() {
  const [viewMode, setViewMode] = useState<'list' | 'scan'>('list')
  const [selectedTask, setSelectedTask] = useState<PickTask | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { selectedFacility } = useFacility()

  const { data: tasks, isLoading, error, refetch, isFetching } = usePickTasks({
    status: '',
    facilityId: selectedFacility?.id || '',
  })
  const confirmPick = useConfirmPick()

  const pickTasks: PickTask[] = useMemo(() => tasks || [], [tasks])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScanForm>({
    resolver: zodResolver(scanSchema) as any,
    defaultValues: { taskId: '', locationScan: '', productScan: '', lotNumber: '', exceptionNotes: '' },
  })

  const pendingTasks = useMemo(() => pickTasks.filter((t) => t.status !== 'completed'), [pickTasks])

  const startScan = useCallback((task: PickTask) => {
    setSelectedTask(task)
    setCurrentIndex(pendingTasks.findIndex((t) => t.id === task.id))
    reset({
      taskId: task.id || '',
      locationScan: '',
      productScan: '',
      lotNumber: '',
      exceptionNotes: '',
    })
    setViewMode('scan')
  }, [pendingTasks, reset])

  const onScanSubmit = useCallback(async (values: ScanForm) => {
    try {
      await confirmPick.mutateAsync({
        taskId: values.taskId,
        lotNumber: values.lotNumber || undefined,
        exceptionNotes: values.exceptionNotes || undefined,
      })
      toast.success('Pick confirmed')
      reset({ taskId: values.taskId, locationScan: '', productScan: '', lotNumber: '', exceptionNotes: '' })

      const nextPending = pendingTasks.filter((t) => t.id !== values.taskId)
      if (nextPending.length > 0) {
        const nextTask = nextPending[0]
        setSelectedTask(nextTask)
        setCurrentIndex(pendingTasks.findIndex((t) => t.id === nextTask.id))
        reset({
          taskId: nextTask.id || '',
          locationScan: '',
          productScan: '',
          lotNumber: '',
          exceptionNotes: '',
        })
      } else {
        setViewMode('list')
        setSelectedTask(null)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Pick confirmation failed')
    }
  }, [confirmPick, pendingTasks, reset])

  const navigateTask = useCallback((direction: 'prev' | 'next') => {
    const idx = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (idx < 0 || idx >= pendingTasks.length) return
    const task = pendingTasks[idx]
    setSelectedTask(task)
    setCurrentIndex(idx)
    reset({
      taskId: task.id || '',
      locationScan: '',
      productScan: '',
      lotNumber: '',
      exceptionNotes: '',
    })
  }, [currentIndex, pendingTasks, reset])

  const columns: ColumnDef<PickTask, any>[] = useMemo(() => [
    {
      id: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.productId?.substring(0, 12) || '—'}</span>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = (row.getValue('status') as string)?.toLowerCase() || 'pending'
        return (
          <Badge variant="outline" className={STATUS_BADGE[s] || ''}>
            {s}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'assignedToUserId',
      header: 'Assigned To',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.assignedToUserId?.substring(0, 12) || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => startScan(row.original)}>
          <Barcode className="mr-1 h-3 w-3" /> Pick
        </Button>
      ),
    },
  ], [startScan])

  const table = useReactTable({
    data: pendingTasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (viewMode === 'scan' && selectedTask) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pick Task</h1>
            <p className="text-muted-foreground">
              Scan items to confirm pick — Task {currentIndex + 1} of {pendingTasks.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateTask('prev')} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateTask('next')} disabled={currentIndex >= pendingTasks.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedTask(null) }}>
              Back to List
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Scan Confirmation
              </CardTitle>
              <CardDescription>Scan the location and product barcode to confirm the pick</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onScanSubmit)} className="space-y-6">
                <input type="hidden" {...register('taskId')} />

                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium">Task Info</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Task ID</span>
                    <span className="font-mono">{selectedTask.id?.substring(0, 16)}</span>
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-mono">{selectedTask.orderId?.substring(0, 16)}</span>
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono font-medium">{selectedTask.quantity}</span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="locationScan">Scan Location Barcode *</Label>
                    <Input
                      id="locationScan"
                      placeholder="Scan or type location code..."
                      autoFocus
                      {...register('locationScan')}
                    />
                    {errors.locationScan && (
                      <p className="text-sm text-destructive">{errors.locationScan.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="productScan">Scan Product Barcode *</Label>
                    <Input
                      id="productScan"
                      placeholder="Scan or type product code..."
                      {...register('productScan')}
                    />
                    {errors.productScan && (
                      <p className="text-sm text-destructive">{errors.productScan.message}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lotNumber">Lot Number (optional)</Label>
                    <Input id="lotNumber" placeholder="Scan lot/batch number..." {...register('lotNumber')} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="exceptionNotes">Exception Notes</Label>
                    <Input
                      id="exceptionNotes"
                      placeholder="e.g. Damaged packaging, short pick..."
                      {...register('exceptionNotes')}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting || confirmPick.isPending}>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirm Pick
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => {
                    const notes = (document.getElementById('exceptionNotes') as HTMLInputElement)?.value || ''
                    if (notes) {
                      handleSubmit(onScanSubmit)()
                    } else {
                      toast.info('Add exception notes to report an issue.')
                    }
                  }}>
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Report Exception
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {pickTasks.filter((t) => t.status === 'completed').length}
                </p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
              <div className="rounded-lg border bg-yellow-50 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">{pendingTasks.length}</p>
                <p className="text-xs text-yellow-600">Pending</p>
              </div>
              <div className="rounded-lg border bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{pickTasks.length}</p>
                <p className="text-xs text-blue-600">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Picking Console</h1>
          <p className="text-muted-foreground">
            Scan-driven picking tasks — {pendingTasks.length} pending of {pickTasks.length} total
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <XCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">Failed to load pick tasks</p>
          <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : pendingTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending pick tasks.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Pick Tasks ({pendingTasks.length})</CardTitle>
            <CardDescription>
              {selectedFacility ? `${selectedFacility.facilityCode} — ${selectedFacility.facilityName}` : 'Select a facility'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
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
                  {table.getRowModel().rows.map((row) => (
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
            <DataTablePagination table={table} className="mt-4" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
