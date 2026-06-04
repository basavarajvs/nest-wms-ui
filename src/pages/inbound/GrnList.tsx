import { useState, useMemo, useCallback } from 'react'
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
import { Plus, Layers, MoreHorizontal, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import {
  useGrns,
  useCreateGrnFromAsn,
  useCreateGrnAdHoc,
  useMarkGrnArrived,
  useStartReceiving,
  useMarkGrnReceived,
  useStartInspection,
  useCompleteInspection,
  useCancelGrn,
  type Grn,
} from '@/features/inbound/goods-receipt/data/grn-queries'
import { GrnLineItemsDialog } from '@/features/inbound/goods-receipt/components/GrnLineItemsDialog'
import { GrnDetailsDialog } from '@/features/inbound/goods-receipt/components/GrnDetailsDialog'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'

const grnFromAsnSchema = z.object({
  asnNumber: z.string().min(1, 'ASN number is required'),
})

const grnAdHocSchema = z.object({
  vendorId: z.string().optional(),
  poNumber: z.string().optional(),
  qcRequired: z.boolean().optional().default(false),
})

type GrnFromAsnForm = z.infer<typeof grnFromAsnSchema>
type GrnAdHocForm = z.infer<typeof grnAdHocSchema>

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  arrived: 'bg-blue-100 text-blue-700',
  receiving: 'bg-purple-100 text-purple-700',
  received: 'bg-green-100 text-green-700',
  inspecting: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const GRN_STATUS_OPTIONS = ['draft', 'arrived', 'receiving', 'received', 'inspecting', 'completed', 'cancelled']

export function GrnList() {
  const [fromAsnOpen, setFromAsnOpen] = useState(false)
  const [adHocOpen, setAdHocOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [linesDialogGrn, setLinesDialogGrn] = useState<Grn | null>(null)
  const [detailDialogGrn, setDetailDialogGrn] = useState<Grn | null>(null)

  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })

  const createFromAsn = useCreateGrnFromAsn()
  const createAdHoc = useCreateGrnAdHoc()
  const { selectedFacility } = useFacility()

  const markArrived = useMarkGrnArrived()
  const startReceiving = useStartReceiving()
  const markReceived = useMarkGrnReceived()
  const startInspection = useStartInspection()
  const completeInspection = useCompleteInspection()
  const cancelGrn = useCancelGrn()

  const { data, isLoading } = useGrns(tableUrlState.pagination as any)

  const fromAsnForm = useForm<GrnFromAsnForm>({
    resolver: zodResolver(grnFromAsnSchema) as any,
    defaultValues: { asnNumber: '' },
  })

  const adHocForm = useForm<GrnAdHocForm>({
    resolver: zodResolver(grnAdHocSchema) as any,
    defaultValues: { vendorId: '', poNumber: '', qcRequired: false },
  })

  const onCreateFromAsn = useCallback(async (values: GrnFromAsnForm) => {
    try {
      await createFromAsn.mutateAsync({ asnNumber: values.asnNumber })
      toast.success('GRN created from ASN successfully')
      setFromAsnOpen(false)
      fromAsnForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create GRN from ASN')
    }
  }, [createFromAsn, fromAsnForm])

  const onCreateAdHoc = useCallback(async (values: GrnAdHocForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createAdHoc.mutateAsync({
        facilityId: selectedFacility.id,
        vendorId: values.vendorId || undefined,
        poNumber: values.poNumber || undefined,
        qcRequired: values.qcRequired,
      })
      toast.success('Ad-hoc GRN created successfully')
      setAdHocOpen(false)
      adHocForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create ad-hoc GRN')
    }
  }, [createAdHoc, adHocForm, selectedFacility])

  const grns = data?.grns ?? []
  const total = data?.total ?? 0

  const columns: ColumnDef<Grn, any>[] = useMemo(
    () => [
      {
        accessorKey: 'receiptNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Receipt #" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.receiptNumber ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'asnNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ASN #" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.asnNumber ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'poNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="PO #" />
        ),
      },
      {
        accessorKey: 'supplier',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Supplier" />
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.original.status ?? 'draft'
          return (
            <Badge variant="outline" className={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )
        },
        filterFn: 'equals',
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const grn = row.original
          const rn = grn.receiptNumber
          const status = grn.status?.toLowerCase() ?? ''
          const terminal = status === 'completed' || status === 'cancelled'

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailDialogGrn(grn)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinesDialogGrn(grn)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Manage Lines
                </DropdownMenuItem>
                {rn && !terminal && (
                  <>
                    {status === 'draft' && (
                      <DropdownMenuItem onClick={async () => {
                        try { await markArrived.mutateAsync({ receiptNumber: rn, dto: {} }); toast.success('GRN marked as arrived') }
                        catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Failed') }
                      }}>
                        Mark Arrived
                      </DropdownMenuItem>
                    )}
                    {status === 'arrived' && (
                      <DropdownMenuItem onClick={async () => {
                        try { await startReceiving.mutateAsync(rn); toast.success('Started receiving') }
                        catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Failed') }
                      }}>
                        Start Receiving
                      </DropdownMenuItem>
                    )}
                    {status === 'receiving' && (
                      <DropdownMenuItem onClick={async () => {
                        try { await markReceived.mutateAsync(rn); toast.success('GRN marked as received') }
                        catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Failed') }
                      }}>
                        Mark Received
                      </DropdownMenuItem>
                    )}
                    {status === 'received' && (
                      <DropdownMenuItem onClick={async () => {
                        try { await startInspection.mutateAsync(rn); toast.success('Inspection started') }
                        catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Failed') }
                      }}>
                        Start Inspection
                      </DropdownMenuItem>
                    )}
                    {status === 'inspecting' && (
                      <DropdownMenuItem onClick={async () => {
                        try { await completeInspection.mutateAsync({ receiptNumber: rn, dto: { result: 'PASS' } }); toast.success('Inspection completed') }
                        catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Failed') }
                      }}>
                        Complete Inspection
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={async () => {
                      try { await cancelGrn.mutateAsync(rn); toast.success('GRN cancelled') }
                      catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'Failed') }
                    }}>
                      Cancel GRN
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: grns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    onColumnFiltersChange: tableUrlState.onColumnFiltersChange,
    state: {
      sorting,
      globalFilter: tableUrlState.globalFilter,
      pagination: tableUrlState.pagination,
      columnFilters: tableUrlState.columnFilters,
    },
    manualPagination: true,
    pageCount: Math.ceil(total / tableUrlState.pagination.pageSize),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goods Receipt Notes</h1>
          <p className="text-muted-foreground">
            Create and track Goods Receipt Notes for inbound shipments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={fromAsnOpen} onOpenChange={setFromAsnOpen}>
            <Button variant="outline" onClick={() => setFromAsnOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              GRN from ASN
            </Button>
            <DialogContent className="sm:max-w-[440px]">
              <form onSubmit={fromAsnForm.handleSubmit(onCreateFromAsn)}>
                <DialogHeader>
                  <DialogTitle>Create GRN from ASN</DialogTitle>
                  <DialogDescription>
                    Generate a Goods Receipt Note from an existing Advance Ship Notice
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="asnNumber">ASN Number *</Label>
                    <Input
                      id="asnNumber"
                      {...fromAsnForm.register('asnNumber')}
                      placeholder="ASN-12345 or UUID"
                    />
                    {fromAsnForm.formState.errors.asnNumber && (
                      <p className="text-sm text-destructive">{fromAsnForm.formState.errors.asnNumber.message}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setFromAsnOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createFromAsn.isPending}>
                    {createFromAsn.isPending ? 'Creating...' : 'Create GRN'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={adHocOpen} onOpenChange={setAdHocOpen}>
            <Button onClick={() => setAdHocOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ad-hoc GRN
            </Button>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={adHocForm.handleSubmit(onCreateAdHoc)}>
                <DialogHeader>
                  <DialogTitle>Create Ad-hoc GRN</DialogTitle>
                  <DialogDescription>
                    Direct goods receipt without a prior ASN
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {selectedFacility && (
                    <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="adHocVendor">Vendor ID</Label>
                      <Input id="adHocVendor" {...adHocForm.register('vendorId')} placeholder="vendor-uuid" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="adHocPo">PO Number</Label>
                      <Input id="adHocPo" {...adHocForm.register('poNumber')} placeholder="e.g. PO-001" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="qcRequired"
                      checked={adHocForm.watch('qcRequired')}
                      onCheckedChange={(checked) => adHocForm.setValue('qcRequired', !!checked)}
                    />
                    <Label htmlFor="qcRequired" className="cursor-pointer">QC Required</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAdHocOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createAdHoc.isPending}>
                    {createAdHoc.isPending ? 'Creating...' : 'Create GRN'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All GRNs</CardTitle>
          <CardDescription>
            {total} GRN{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableToolbar
            table={table}
            searchPlaceholder="Search GRNs..."
            searchKey="receiptNumber"
            filters={[
              {
                columnId: 'status',
                title: 'Status',
                options: GRN_STATUS_OPTIONS.map((s) => ({
                  label: s.charAt(0).toUpperCase() + s.slice(1),
                  value: s,
                })),
              },
            ]}
          />
          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : grns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">No GRNs found.</TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} className="mt-4" />
        </CardContent>
      </Card>

      {linesDialogGrn && (
        <GrnLineItemsDialog
          grnId={linesDialogGrn.id}
          open={!!linesDialogGrn}
          onOpenChange={(open) => { if (!open) setLinesDialogGrn(null) }}
        />
      )}

      {detailDialogGrn && (
        <GrnDetailsDialog
          grn={detailDialogGrn}
          open={!!detailDialogGrn}
          onOpenChange={(open) => { if (!open) setDetailDialogGrn(null) }}
        />
      )}
    </div>
  )
}
