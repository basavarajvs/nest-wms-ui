import { useMemo } from 'react'
import { type ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import type { WizardAsnHeader } from './BasicInfoStep'
import type { WizardAsnLine } from './LineItemsStep'

interface ReviewStepProps {
  header: WizardAsnHeader
  lines: WizardAsnLine[]
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '-'}</p>
    </div>
  )
}

export function ReviewStep({ header, lines }: ReviewStepProps) {
  const totalQty = lines.reduce((sum, l) => sum + (l.expectedQuantity || 0), 0)
  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '-')

  const columns: ColumnDef<WizardAsnLine, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Product" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.productName || row.original.productCode || row.original.productId}
          </span>
        ),
      },
      {
        accessorKey: 'expectedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Qty" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.expectedQuantity}</span>
        ),
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="UOM" />
        ),
      },
      {
        accessorKey: 'lotNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lot #" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.lotNumber || '-'}</span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Expiry" />
        ),
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.expiryDate ? formatDate(row.original.expiryDate) : '-'}
          </span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">ASN Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Vendor ID" value={header.vendorId} />
          <InfoCard label="PO Number" value={header.poNumber} />
          <InfoCard label="Carrier" value={header.carrierName} />
          <InfoCard label="Tracking #" value={header.trackingNumber} />
          <InfoCard label="Expected Arrival" value={formatDate(header.expectedArrivalDate)} />
        </div>
        {header.notes && (
          <div className="mt-3 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-0.5 text-sm">{header.notes}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">
          Line Items ({lines.length} items, {totalQty} total qty)
        </h3>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items added.</p>
        ) : (
          <div className="rounded-md border">
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
        )}
      </div>
    </div>
  )
}
