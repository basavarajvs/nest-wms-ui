import { useState, useMemo } from 'react'
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
import { Plus, Layers, MoreHorizontal, Eye, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  useAsns,
  type Asn,
} from '@/features/inbound/asns/data/asn-queries'
import { AsnLineItemsDialog } from '@/features/inbound/asns/components/AsnLineItemsDialog'
import { AsnCreateWizard } from '@/features/inbound/asns/components/AsnCreateWizard'
import { AsnDetailsDialog } from '@/features/inbound/asns/components/AsnDetailsDialog'
import { AsnReceivingDialog } from '@/features/inbound/asns/components/AsnReceivingDialog'
import { Badge } from '@/components/ui/badge'

const ASN_STATUS_OPTIONS = ['draft', 'sent', 'in_transit', 'arrived', 'received', 'cancelled']

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  arrived: 'bg-indigo-100 text-indigo-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function AsnList() {
  const [createOpen, setCreateOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [linesDialogAsn, setLinesDialogAsn] = useState<Asn | null>(null)
  const [detailDialogAsn, setDetailDialogAsn] = useState<Asn | null>(null)
  const [receivingDialogAsn, setReceivingDialogAsn] = useState<Asn | null>(null)

  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate: navigate as any,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })

  const { data, isLoading } = useAsns(tableUrlState.pagination as any)

  const asns = data?.asns ?? []
  const total = data?.total ?? 0

  const columns: ColumnDef<Asn, any>[] = useMemo(
    () => [
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
            <Badge
              variant="outline"
              className={STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          )
        },
        filterFn: 'equals',
      },
      {
        accessorKey: 'expectedDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Expected" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.expectedDate
              ? new Date(row.original.expectedDate).toLocaleDateString()
              : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString()
              : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const asn = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDetailDialogAsn(asn)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLinesDialogAsn(asn)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Manage Lines
                </DropdownMenuItem>
                {(asn.status?.toLowerCase() === 'arrived' || asn.status?.toLowerCase() === 'in_transit') && (
                  <DropdownMenuItem onClick={() => setReceivingDialogAsn(asn)}>
                    <Radio className="mr-2 h-4 w-4" />
                    Start Receiving
                  </DropdownMenuItem>
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
    data: asns,
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
          <h1 className="text-2xl font-bold tracking-tight">Advance Ship Notices</h1>
          <p className="text-muted-foreground">
            Create and manage inbound ASNs from vendors
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New ASN
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All ASNs</CardTitle>
          <CardDescription>
            {total} ASN{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableToolbar
            table={table}
            searchPlaceholder="Search ASNs..."
            searchKey="asnNumber"
            filters={[
              {
                columnId: 'status',
                title: 'Status',
                options: ASN_STATUS_OPTIONS.map((s) => ({
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
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : asns.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No ASNs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} className="mt-4" />
        </CardContent>
      </Card>

      <AsnCreateWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {linesDialogAsn && (
        <AsnLineItemsDialog
          asnId={linesDialogAsn.id}
          asnStatus={linesDialogAsn.status}
          open={!!linesDialogAsn}
          onOpenChange={(open) => {
            if (!open) setLinesDialogAsn(null)
          }}
        />
      )}

      {detailDialogAsn && (
        <AsnDetailsDialog
          asnId={detailDialogAsn.id}
          open={!!detailDialogAsn}
          onOpenChange={(open) => {
            if (!open) setDetailDialogAsn(null)
          }}
        />
      )}

      {receivingDialogAsn && (
        <AsnReceivingDialog
          asnId={receivingDialogAsn.id}
          asnNumber={receivingDialogAsn.asnNumber}
          open={!!receivingDialogAsn}
          onOpenChange={(open) => {
            if (!open) setReceivingDialogAsn(null)
          }}
        />
      )}
    </div>
  )
}
