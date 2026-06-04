import { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Plus, Edit, Trash2, Loader2, Package, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ConfirmDialog } from '@/components/common/dialogs/ConfirmDialog'
import {
  useOrderLines,
  useCreateOrderLine,
  useUpdateOrderLine,
  useDeleteOrderLine,
  type OrderLine,
} from '../data/order-line-queries'
import type { Product } from '@/features/items/products/data/product-queries'

const orderLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  uomId: z.string().min(1, 'UOM is required'),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
})

type OrderLineFormValues = z.infer<typeof orderLineSchema>

const DEFAULT_UOMS = [
  { value: 'EA', label: 'Each (EA)' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'LB', label: 'Pound (LB)' },
  { value: 'PCS', label: 'Pieces (PCS)' },
  { value: 'BOX', label: 'Box (BOX)' },
  { value: 'PAL', label: 'Pallet (PAL)' },
  { value: 'CTN', label: 'Carton (CTN)' },
  { value: 'BAG', label: 'Bag (BAG)' },
  { value: 'DRM', label: 'Drum (DRM)' },
  { value: 'L', label: 'Liter (L)' },
]

interface OrderLineItemsDialogProps {
  orderId: string
  orderStatus?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function isEditableStatus(status?: string): boolean {
  if (!status) return true
  const nonEditable = ['allocated', 'released', 'picked', 'packed', 'shipped', 'cancelled']
  return !nonEditable.includes(status.toLowerCase())
}

function formatCurrency(value?: number): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function OrderLineItemsDialog({
  orderId,
  orderStatus,
  open,
  onOpenChange,
}: OrderLineItemsDialogProps) {
  const { data, isLoading } = useOrderLines(orderId)
  const createLine = useCreateOrderLine()
  const updateLine = useUpdateOrderLine()
  const deleteLine = useDeleteOrderLine()

  const [lineDialogOpen, setLineDialogOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<OrderLine | null>(null)
  const [lineToDelete, setLineToDelete] = useState<OrderLine | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)

  const editable = isEditableStatus(orderStatus)

  const lines: OrderLine[] = data?.lines ?? []
  const total = data?.total ?? 0
  const grandTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.quantity, 0),
    [lines]
  )

  const form = useForm<OrderLineFormValues>({
    resolver: zodResolver(orderLineSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      uomId: '',
      unitPrice: undefined,
      notes: '',
    },
  })

  const handleOpenLineDialog = useCallback(
    (line?: OrderLine) => {
      if (line) {
        setEditingLine(line)
        setSelectedProduct(undefined)
        form.reset({
          productId: line.productId,
          quantity: line.quantity,
          uomId: line.uomId,
          unitPrice: line.unitPrice ?? undefined,
          notes: line.notes ?? '',
        })
      } else {
        setEditingLine(null)
        setSelectedProduct(undefined)
        form.reset({
          productId: '',
          quantity: 1,
          uomId: '',
          unitPrice: undefined,
          notes: '',
        })
      }
      setLineDialogOpen(true)
    },
    [form]
  )

  const onSubmitLine = async (values: OrderLineFormValues) => {
    try {
      if (editingLine) {
        await updateLine.mutateAsync({
          id: editingLine.id,
          dto: {
            quantity: values.quantity,
            uomId: values.uomId,
            unitPrice: values.unitPrice,
            notes: values.notes || undefined,
          },
        })
        toast.success('Order line updated')
      } else {
        await createLine.mutateAsync({
          orderId,
          productId: values.productId,
          quantity: values.quantity,
          uomId: values.uomId,
          unitPrice: values.unitPrice,
          notes: values.notes || undefined,
        })
        toast.success('Order line created')
      }
      setLineDialogOpen(false)
      setEditingLine(null)
      setSelectedProduct(undefined)
      form.reset()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Operation failed'
      )
    }
  }

  const handleDeleteLine = async () => {
    if (!lineToDelete) return
    try {
      await deleteLine.mutateAsync(lineToDelete.id)
      toast.success('Order line deleted')
      setLineToDelete(null)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Delete failed'
      )
    }
  }

  const handleProductChange = useCallback(
    (_productCode: string, product: Product | undefined) => {
      setSelectedProduct(product)
      form.setValue('productId', product?.id ?? '', {
        shouldValidate: true,
      })
    },
    [form]
  )

  const selectedProductId = form.watch('productId')

  const columns: ColumnDef<OrderLine, any>[] = useMemo(
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
        accessorKey: 'quantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Qty" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.quantity}</span>
        ),
      },
      {
        accessorKey: 'allocatedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Allocated" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.allocatedQuantity ?? 0}
          </span>
        ),
      },
      {
        accessorKey: 'pickedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Picked" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.pickedQuantity ?? 0}
          </span>
        ),
      },
      {
        accessorKey: 'packedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Packed" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.packedQuantity ?? 0}
          </span>
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
            {formatCurrency(row.original.unitPrice)}
          </span>
        ),
      },
      {
        id: 'lineTotal',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Line Total" />
        ),
        cell: ({ row }) => {
          const line = row.original
          const total = (line.unitPrice ?? 0) * line.quantity
          return (
            <span className="font-mono text-sm font-medium">
              {formatCurrency(total)}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Actions" />
        ),
        cell: ({ row }) => {
          const line = row.original
          if (!editable) return null
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpenLineDialog(line)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setLineToDelete(line)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )
        },
      },
    ],
    [editable, handleOpenLineDialog, setLineToDelete]
  )

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[1100px]">
          <DialogHeader>
            <DialogTitle>Order Lines</DialogTitle>
            <DialogDescription>
              Manage line items for order {orderId.slice(0, 8)}...
              {orderStatus && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      orderStatus === 'shipped'
                        ? 'bg-green-500'
                        : orderStatus === 'cancelled'
                          ? 'bg-destructive'
                          : orderStatus === 'allocated' || orderStatus === 'released'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                    }`}
                  />
                  {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {total} line{total !== 1 ? 's' : ''}
                {grandTotal > 0 && (
                  <span className="ml-3 font-medium">
                    — Grand Total: {formatCurrency(grandTotal)}
                  </span>
                )}
              </span>
              {editable && (
                <Button
                  size="sm"
                  onClick={() => handleOpenLineDialog()}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Line
                </Button>
              )}
            </div>

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
                    <TableCell colSpan={columns.length} className="py-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                        <span>No lines yet</span>
                        {editable && (
                          <span className="text-xs">
                            Click "Add Line" to add products to this order
                          </span>
                        )}
                      </div>
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

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lineDialogOpen} onOpenChange={setLineDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={form.handleSubmit(onSubmitLine)}>
            <DialogHeader>
              <DialogTitle>
                {editingLine ? 'Edit Order Line' : 'Add Order Line'}
              </DialogTitle>
              <DialogDescription>
                {editingLine
                  ? 'Update line item details'
                  : 'Add a product to this order'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {!editingLine && (
                <div className="grid gap-2">
                  <Label>
                    Product <span className="text-destructive">*</span>
                  </Label>
                  <ProductSearchSelect
                    value={
                      selectedProduct?.productCode ??
                      (selectedProductId ? undefined : undefined)
                    }
                    onValueChange={handleProductChange}
                    placeholder="Search and select product..."
                  />
                  {form.formState.errors.productId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.productId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>
                    Quantity <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                  {form.formState.errors.quantity && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.quantity.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label>
                    UOM <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(v) => form.setValue('uomId', v)}
                    value={form.watch('uomId') ?? ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_UOMS.map((uom) => (
                        <SelectItem key={uom.value} value={uom.value}>
                          {uom.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.uomId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.uomId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Unit Price</Label>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="pl-7"
                      {...form.register('unitPrice', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input
                    {...form.register('notes')}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLineDialogOpen(false)
                  setEditingLine(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLine.isPending || updateLine.isPending}
              >
                {createLine.isPending || updateLine.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingLine ? (
                  'Update Line'
                ) : (
                  'Add Line'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!lineToDelete}
        onOpenChange={(open) => !open && setLineToDelete(null)}
        title="Delete Order Line?"
        description={
          lineToDelete
            ? `Remove line #${lineToDelete.lineNumber ?? ''} (${
                lineToDelete.productName ?? lineToDelete.productId
              }). This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        isDestructive
        isLoading={deleteLine.isPending}
        onConfirm={handleDeleteLine}
      />
    </>
  )
}
