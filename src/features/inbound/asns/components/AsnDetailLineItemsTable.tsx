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
import { cn } from '@/lib/utils'

export interface DetailLineItem {
  id: string
  lineNumber?: number
  productId: string
  productName?: string
  productSku?: string
  expectedQuantity: number
  receivedQuantity?: number
  uomId: string
  lotNumber?: string
  expiryDate?: string
}

function getLineStatus(line: DetailLineItem): string {
  if (!line.receivedQuantity || line.receivedQuantity === 0) return 'Pending'
  if (line.receivedQuantity >= line.expectedQuantity) return 'Received'
  return 'Partially Received'
}

function hasVariance(line: DetailLineItem): boolean {
  if (!line.receivedQuantity || line.receivedQuantity === 0) return false
  return line.receivedQuantity !== line.expectedQuantity
}

function formatDate(d?: string): string {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}

interface AsnDetailLineItemsTableProps {
  lines: DetailLineItem[]
}

export function AsnDetailLineItemsTable({ lines }: AsnDetailLineItemsTableProps) {
  const columns: ColumnDef<DetailLineItem, any>[] = useMemo(
    () => [
      {
        accessorKey: 'lineNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="#" />
        ),
        cell: ({ row, table }) => (
          <span className="font-mono text-xs">
            {row.original.lineNumber ?? (table.getRowModel().rows.indexOf(row) + 1)}
          </span>
        ),
      },
      {
        id: 'product',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Product" />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {row.original.productName ?? row.original.productId}
            </span>
            {row.original.productSku && (
              <span className="text-xs text-muted-foreground">
                {row.original.productSku}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'expectedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Expected" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.expectedQuantity}</span>
        ),
      },
      {
        accessorKey: 'receivedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Received" />
        ),
        cell: ({ row }) => {
          const variance = hasVariance(row.original)
          return (
            <span
              className={cn(
                'font-mono text-sm',
                variance && 'font-bold text-amber-600'
              )}
            >
              {row.original.receivedQuantity ?? 0}
              {variance && (
                <span className="ml-1 text-xs text-amber-500">
                  (Δ{row.original.expectedQuantity - (row.original.receivedQuantity ?? 0)})
                </span>
              )}
            </span>
          )
        },
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="UOM" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.uomId}</span>
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
          <span className="text-xs">{formatDate(row.original.expiryDate)}</span>
        ),
      },
      {
        id: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const lineStatus = getLineStatus(row.original)
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                lineStatus === 'Received'
                  ? 'bg-green-100 text-green-700'
                  : lineStatus === 'Partially Received'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
              )}
            >
              {lineStatus}
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

  if (lines.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No line items
      </p>
    )
  }

  return (
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
  )
}
