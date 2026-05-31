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
import type { OrderStatus } from '@/types/warehouse-statuses'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { OrderStatusBadge } from '@/components/status-badges'
import {
  useOrders,
  useCreateOrder,
  type Order,
} from '@/features/outbound/orders/data/order-queries'

const orderSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required'),
  orderType: z.string().optional(),
  priority: z.coerce.number().optional(),
  requestedDeliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
})

type OrderForm = z.infer<typeof orderSchema>

const STATUS_FILTER_OPTIONS = [
  { label: 'Created', value: 'created' },
  { label: 'Validated', value: 'validated' },
  { label: 'Allocated', value: 'allocated' },
  { label: 'Released', value: 'released' },
  { label: 'Picked', value: 'picked' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
]

const PRIORITY_OPTIONS = [
  { value: '1', label: '1 - Lowest' },
  { value: '2', label: '2 - Low' },
  { value: '3', label: '3 - Normal' },
  { value: '4', label: '4 - High' },
  { value: '5', label: '5 - Critical' },
]

export function OrderList() {
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

  const { data, isLoading, isError, error, refetch, isFetching } = useOrders({
    page: 1,
    limit: 100,
    status: '',
    clientCode: '',
  })
  const createMutation = useCreateOrder()
  const { selectedFacility } = useFacility()

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      clientCode: '',
      orderType: 'standard',
      priority: 3,
      requestedDeliveryDate: '',
      deliveryAddress: '',
      notes: '',
    },
  })

  const orders: Order[] = data?.orders || []

  const columns: ColumnDef<Order, any>[] = useMemo(
    () => [
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Order #' />
        ),
        cell: ({ row }) => (
          <span className='font-mono text-sm font-medium'>
            {row.getValue('orderNumber') ||
              row.original.id.substring(0, 12) + '...'}
          </span>
        ),
      },
      {
        accessorKey: 'clientCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Client' />
        ),
      },
      {
        accessorKey: 'orderType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground capitalize'>
            {row.getValue('orderType') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <OrderStatusBadge
            status={
              ((
                row.getValue('status') as string
              )?.toUpperCase() as OrderStatus) ||
              (row.getValue('status') as OrderStatus)
            }
          />
        ),
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Priority' />
        ),
        cell: ({ row }) => {
          const priority = row.getValue('priority') as number | null | undefined
          return priority != null ? (
            <Badge
              variant={
                priority >= 5
                  ? 'destructive'
                  : priority >= 3
                    ? 'default'
                    : 'secondary'
              }
            >
              {priority}
            </Badge>
          ) : (
            '—'
          )
        },
      },
      {
        accessorKey: 'requestedDeliveryDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Requested Date' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('requestedDeliveryDate') as
            | string
            | undefined
          return date ? new Date(date).toLocaleDateString() : '—'
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: orders,
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

  const onCreateSubmit = async (formData: OrderForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
        clientCode: formData.clientCode,
        orderType: formData.orderType || undefined,
        priority: formData.priority,
        requestedDeliveryDate: formData.requestedDeliveryDate || undefined,
        notes: formData.notes || undefined,
      })
      toast.success('Sales Order created successfully')
      setDialogOpen(false)
      form.reset()
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to create order'
      )
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Sales Orders</h1>
          <p className='text-muted-foreground'>
            Manage outbound customer orders
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
            <Plus className='mr-2 h-4 w-4' /> New Order
          </Button>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchKey='clientCode'
        searchPlaceholder='Filter by client code...'
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
          <CardTitle>Orders ({orders.length})</CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load orders
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
              <p className='font-medium text-muted-foreground'>
                No orders found
              </p>
              <p className='max-w-md text-sm text-muted-foreground'>
                {tableUrlState.globalFilter || tableUrlState.columnFilters.length > 0
                  ? 'No orders match the current filters. Try clearing filters.'
                  : 'Create your first sales order to get started.'}
              </p>
              {!tableUrlState.globalFilter && tableUrlState.columnFilters.length === 0 && (
                <Button size='sm' onClick={() => setDialogOpen(true)}>
                  <Plus className='mr-2 h-4 w-4' /> Create Order
                </Button>
              )}
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
        <DialogContent className='sm:max-w-[560px]'>
          <form onSubmit={form.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create New Sales Order</DialogTitle>
              <DialogDescription>
                Enter order details. Inventory will be allocated upon creation.
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
                <Label htmlFor='clientCode'>Client Code *</Label>
                <Input
                  id='clientCode'
                  {...form.register('clientCode')}
                  placeholder='e.g. CLIENT-001'
                />
                {form.formState.errors.clientCode && (
                  <p className='text-sm text-destructive'>
                    {form.formState.errors.clientCode.message}
                  </p>
                )}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='orderType'>Order Type</Label>
                  <Input
                    id='orderType'
                    {...form.register('orderType')}
                    placeholder='standard'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='priority'>Priority</Label>
                  <Select
                    value={String(form.watch('priority') ?? 3)}
                    onValueChange={(v) =>
                      form.setValue('priority', parseInt(v))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select priority' />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='requestedDeliveryDate'>
                  Requested Delivery Date
                </Label>
                <Input
                  id='requestedDeliveryDate'
                  type='date'
                  {...form.register('requestedDeliveryDate')}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='deliveryAddress'>Delivery Address</Label>
                <Textarea
                  id='deliveryAddress'
                  {...form.register('deliveryAddress')}
                  rows={2}
                  placeholder='Street, city, postal code...'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='notes'>Notes</Label>
                <Textarea
                  id='notes'
                  {...form.register('notes')}
                  rows={2}
                  placeholder='Additional notes...'
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
                {createMutation.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
