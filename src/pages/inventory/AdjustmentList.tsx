import { useState, useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { Plus, RefreshCw, ClipboardX } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import {
  useAdjustments,
  useCreateAdjustment,
  useSubmitAdjustment,
  useApproveAdjustment,
  type Adjustment,
} from '@/features/inventory/adjustments/data/adjustment-queries'

const adjustmentSchema = z.object({
  reasonCode: z.string().min(1, 'Reason code is required'),
  notes: z.string().optional(),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

const STATUS_FILTER_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Posted', value: 'posted' },
]

const STATUS_BADGE: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  submitted: 'default',
  approved: 'default',
  rejected: 'destructive',
  posted: 'outline',
}

export function AdjustmentList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } =
    useAdjustments({
      page: 1,
      limit: 100,
      status: '',
    })
  const createMutation = useCreateAdjustment()
  const submitMutation = useSubmitAdjustment()
  const approveMutation = useApproveAdjustment()
  const { selectedFacility } = useFacility()

  const form = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema) as any,
    defaultValues: { reasonCode: '', notes: '' },
  })

  const adjustments: Adjustment[] = data?.adjustments || []

  const columns: ColumnDef<Adjustment, any>[] = useMemo(
    () => [
      {
        accessorKey: 'reference',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Reference / ID' />
        ),
        cell: ({ row }) => (
          <span className='block max-w-[120px] truncate font-mono text-xs'>
            {row.getValue('reference') ||
              row.original.id.substring(0, 12) + '...'}
          </span>
        ),
      },
      {
        accessorKey: 'reasonCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Reason' />
        ),
        cell: ({ row }) => (
          <div>
            <div>
              {row.getValue('reasonCode') || row.original.reason || '—'}
            </div>
            {row.original.notes && (
              <div className='line-clamp-1 text-xs text-muted-foreground'>
                {row.original.notes}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
          const status = (row.getValue('status') as string) || 'draft'
          return (
            <Badge variant={STATUS_BADGE[status] || 'secondary'}>
              {status}
            </Badge>
          )
        },
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Created' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string | undefined
          return date ? new Date(date).toLocaleDateString() : '—'
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const adj = row.original
          return (
            <div className='flex items-center justify-end gap-1'>
              {adj.status === 'draft' && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleSubmit(adj.id)}
                >
                  Submit
                </Button>
              )}
              {adj.status === 'submitted' && (
                <>
                  <Button size='sm' onClick={() => handleApprove(adj.id)}>
                    Approve
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled
                    title='Reject endpoint not available in current API'
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: adjustments,
    columns,
    state: {
      sorting,
      globalFilter: tableUrlState.globalFilter ?? '',
      columnFilters: tableUrlState.columnFilters,
      pagination: tableUrlState.pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onColumnFiltersChange: tableUrlState.onColumnFiltersChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleSubmit = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id)
      toast.success('Adjustment submitted for approval')
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Submit failed'
      )
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id)
      toast.success('Adjustment approved')
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Approve failed'
      )
    }
  }

  const onCreateSubmit = async (formData: AdjustmentForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
        reasonCode: formData.reasonCode,
        notes: formData.notes || undefined,
      })
      toast.success('Adjustment created (draft)')
      setDialogOpen(false)
      form.reset()
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to create adjustment'
      )
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Inventory Adjustments
          </h1>
          <p className='text-muted-foreground'>
            Create, submit, and approve stock corrections
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> New Adjustment
          </Button>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by reference or reason...'
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>
            Adjustments {adjustments.length ? `(${adjustments.length})` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className='h-9 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load adjustments
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <ClipboardX className='h-12 w-12 text-muted-foreground/30' />
              <p className='font-medium text-muted-foreground'>
                No adjustments found
              </p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <form onSubmit={form.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Inventory Adjustment</DialogTitle>
              <DialogDescription>
                Provide reason code and facility. Lines may be added after
                creation.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              {selectedFacility && (
                <div className='rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground'>
                  Facility:{' '}
                  <span className='font-medium text-foreground'>
                    {selectedFacility.facilityCode} —{' '}
                    {selectedFacility.facilityName}
                  </span>
                </div>
              )}
              <div className='grid gap-2'>
                <Label htmlFor='reasonCode'>Reason Code *</Label>
                <Input
                  id='reasonCode'
                  {...form.register('reasonCode')}
                  placeholder='e.g. DAMAGE, CYCLE_COUNT'
                />
                {form.formState.errors.reasonCode && (
                  <p className='text-sm text-destructive'>
                    {form.formState.errors.reasonCode.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  {...form.register('notes')}
                  rows={3}
                  placeholder='Optional details...'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Draft'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
