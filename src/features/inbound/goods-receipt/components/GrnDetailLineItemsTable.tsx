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
import type { GrnLine } from '../data/grn-line-queries'

type Variance = 'match' | 'short' | 'over' | 'pending'

function getVariance(line: GrnLine): Variance {
  const rcv = line.receivedQuantity ?? 0
  if (rcv === 0) return 'pending'
  if (rcv === line.expectedQuantity) return 'match'
  if (rcv < line.expectedQuantity) return 'short'
  return 'over'
}

const VARIANCE_CONFIG: Record<Variance, { label: string; classes: string }> = {
  match: { label: 'Match', classes: 'bg-green-100 text-green-700' },
  short: { label: 'Short', classes: 'bg-orange-100 text-orange-700' },
  over: { label: 'Over', classes: 'bg-red-100 text-red-700' },
  pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
}

function formatDate(d?: string): string {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

interface GrnDetailLineItemsTableProps {
  lines: GrnLine[]
}

export function GrnDetailLineItemsTable({ lines }: GrnDetailLineItemsTableProps) {
  const columns: ColumnDef<GrnLine, any>[] = useMemo(
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
              <span className="text-xs text-muted-foreground">{row.original.productSku}</span>
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
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.receivedQuantity ?? 0}</span>
        ),
      },
      {
        id: 'variance',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Variance" />
        ),
        cell: ({ row }) => {
          const v = getVariance(row.original)
          const config = VARIANCE_CONFIG[v]
          return (
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.classes)}>
              {config.label}
            </span>
          )
        },
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
          <span className="text-xs">{formatDate(row.original.expiryDate)}</span>
        ),
      },
      {
        accessorKey: 'damagedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Damaged" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.damagedQuantity ?? 0}</span>
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

  if (lines.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No line items</p>
  }

  return (
    <div className="rounded-md border">
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
  )
}
