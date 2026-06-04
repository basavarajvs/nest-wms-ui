import { useMemo, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { type ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { ProductSearchSelect } from '@/components/ProductSearchSelect'
import type { Product } from '@/features/items/products/data/product-queries'

const DEFAULT_UOMS = [
  { value: 'EA', label: 'EA' },
  { value: 'KG', label: 'KG' },
  { value: 'LB', label: 'LB' },
  { value: 'PCS', label: 'PCS' },
  { value: 'BOX', label: 'BOX' },
  { value: 'PAL', label: 'PAL' },
  { value: 'CTN', label: 'CTN' },
  { value: 'BAG', label: 'BAG' },
  { value: 'DRM', label: 'DRM' },
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
  { value: 'FT', label: 'FT' },
]

export interface WizardAsnLine {
  tempId: string
  productId: string
  productName: string
  productCode: string
  expectedQuantity: number
  uomId: string
  lotNumber: string
  expiryDate: string
}

interface LineItemsStepProps {
  lines: WizardAsnLine[]
  onAddLine: () => void
  onUpdateLine: (tempId: string, updates: Partial<WizardAsnLine>) => void
  onRemoveLine: (tempId: string) => void
}

export function LineItemsStep({ lines, onAddLine, onUpdateLine, onRemoveLine }: LineItemsStepProps) {
  const handleProductSelect = useCallback(
    (tempId: string, productCode: string, product?: Product) => {
      onUpdateLine(tempId, {
        productCode,
        productId: product?.id ?? productCode,
        productName: product?.name ?? '',
      })
    },
    [onUpdateLine]
  )

  const columns: ColumnDef<WizardAsnLine, any>[] = useMemo(
    () => [
      {
        id: 'product',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Product" />
        ),
        cell: ({ row }) => (
          <ProductSearchSelect
            value={row.original.productCode}
            onValueChange={(code, product) =>
              handleProductSelect(row.original.tempId, code, product)
            }
            placeholder="Search product..."
          />
        ),
      },
      {
        accessorKey: 'expectedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Qty" />
        ),
        cell: ({ row }) => (
          <Input
            type="number"
            min={1}
            value={row.original.expectedQuantity || ''}
            onChange={(e) =>
              onUpdateLine(row.original.tempId, {
                expectedQuantity: Number(e.target.value) || 0,
              })
            }
            className="h-8"
          />
        ),
      },
      {
        accessorKey: 'uomId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="UOM" />
        ),
        cell: ({ row }) => (
          <Select
            value={row.original.uomId}
            onValueChange={(val) =>
              onUpdateLine(row.original.tempId, { uomId: val })
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="UOM" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_UOMS.map((uom) => (
                <SelectItem key={uom.value} value={uom.value}>
                  {uom.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: 'lotNumber',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lot #" />
        ),
        cell: ({ row }) => (
          <Input
            value={row.original.lotNumber}
            onChange={(e) =>
              onUpdateLine(row.original.tempId, { lotNumber: e.target.value })
            }
            placeholder="Optional"
            className="h-8"
          />
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Expiry" />
        ),
        cell: ({ row }) => (
          <Input
            type="date"
            value={row.original.expiryDate}
            onChange={(e) =>
              onUpdateLine(row.original.tempId, { expiryDate: e.target.value })
            }
            className="h-8"
          />
        ),
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="" />
        ),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onRemoveLine(row.original.tempId)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        ),
      },
    ],
    [handleProductSelect, onUpdateLine, onRemoveLine]
  )

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const itemCount = lines.length
  const totalQty = lines.reduce((sum, l) => sum + (l.expectedQuantity || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add the products and quantities expected in this ASN.
        </p>
        <Button size="sm" variant="outline" onClick={onAddLine}>
          <Plus className="mr-1 h-3 w-3" /> Add Item
        </Button>
      </div>

      {lines.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No line items yet. Click "Add Item" to start adding products.
        </div>
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

      <div className="flex items-center gap-4 rounded-md bg-muted px-4 py-2 text-sm">
        <span className="font-medium">Summary:</span>
        <span>
          Total Items: <span className="font-mono font-medium">{itemCount}</span>
        </span>
        <span>
          Total Quantity:{' '}
          <span className="font-mono font-medium">{totalQty}</span>
        </span>
      </div>
    </div>
  )
}
