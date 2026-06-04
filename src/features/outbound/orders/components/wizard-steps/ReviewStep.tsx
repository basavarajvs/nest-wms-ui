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
import type { WizardOrderHeader } from './BasicInfoStep'
import type { WizardOrderLine } from './LineItemsStep'

interface ReviewStepProps {
  header: WizardOrderHeader
  lines: WizardOrderLine[]
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '-'}</p>
    </div>
  )
}

const PRIORITY_LABELS: Record<string, string> = {
  '1': '1 - Lowest',
  '2': '2 - Low',
  '3': '3 - Normal',
  '4': '4 - High',
  '5': '5 - Critical',
}

export function ReviewStep({ header, lines }: ReviewStepProps) {
  const totalQty = lines.reduce((sum, l) => sum + (l.quantity || 0), 0)
  const totalValue = lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0), 0)
  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '-')

  const columns: ColumnDef<WizardOrderLine, any>[] = useMemo(
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
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Qty" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.quantity}</span>
        ),
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="UOM" />
        ),
      },
      {
        accessorKey: 'unitPrice',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Unit Price" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            ${(row.original.unitPrice || 0).toFixed(2)}
          </span>
        ),
      },
      {
        id: 'lineTotal',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Line Total" />
        ),
        cell: ({ row }) => {
          const total = (row.original.quantity || 0) * (row.original.unitPrice || 0)
          return (
            <span className="font-mono text-sm font-medium">
              ${total.toFixed(2)}
            </span>
          )
        },
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
        <h3 className="mb-3 text-sm font-semibold">Order Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Client" value={header.clientName || header.clientCode} />
          <InfoCard label="Order Type" value={header.orderType} />
          <InfoCard
            label="Priority"
            value={PRIORITY_LABELS[header.priority] || header.priority}
          />
          <InfoCard
            label="Requested Delivery Date"
            value={formatDate(header.requestedDeliveryDate)}
          />
        </div>
      </div>

      {header.deliveryAddress && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Delivery Address</h3>
          <div className="rounded-lg border p-3">
            <p className="text-sm whitespace-pre-wrap">{header.deliveryAddress}</p>
          </div>
        </div>
      )}

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
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
        )}
        <div className="mt-2 flex justify-end rounded-md bg-muted px-4 py-2 text-sm">
          <span className="font-medium">
            Grand Total:{' '}
            <span className="font-mono">${totalValue.toFixed(2)}</span>
          </span>
        </div>
      </div>

      {header.notes && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Notes</h3>
          <div className="rounded-lg border p-3">
            <p className="text-sm whitespace-pre-wrap">{header.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
