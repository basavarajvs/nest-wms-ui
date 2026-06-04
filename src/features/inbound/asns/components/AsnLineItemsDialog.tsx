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
import { Plus, Edit, Trash2, Loader2, Package } from 'lucide-react'
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
import { Form } from '@/components/ui/form'
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
  useAsnLines,
  useCreateAsnLine,
  useUpdateAsnLine,
  useDeleteAsnLine,
  type AsnLine,
} from '../data/asn-line-queries'
import type { Product } from '@/features/items/products/data/product-queries'

const asnLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  expectedQuantity: z.number().min(1, 'Quantity must be greater than 0'),
  uomId: z.string().min(1, 'UOM is required'),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
})

type AsnLineFormValues = z.infer<typeof asnLineSchema>

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

interface AsnLineItemsDialogProps {
  asnId: string
  asnStatus?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function isEditableStatus(status?: string): boolean {
  if (!status) return true
  const nonEditable = ['received', 'cancelled']
  return !nonEditable.includes(status.toLowerCase())
}

function getLineStatus(line: AsnLine): string {
  if (!line.receivedQuantity || line.receivedQuantity === 0) return 'Pending'
  if (line.receivedQuantity >= line.expectedQuantity) return 'Received'
  return 'Partially Received'
}

export function AsnLineItemsDialog({
  asnId,
  asnStatus,
  open,
  onOpenChange,
}: AsnLineItemsDialogProps) {
  const { data, isLoading } = useAsnLines(asnId)
  const createLine = useCreateAsnLine()
  const updateLine = useUpdateAsnLine()
  const deleteLine = useDeleteAsnLine()

  const [lineDialogOpen, setLineDialogOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<AsnLine | null>(null)
  const [lineToDelete, setLineToDelete] = useState<AsnLine | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)

  const editable = isEditableStatus(asnStatus)

  const lines: AsnLine[] = data?.lines ?? []
  const total = data?.total ?? 0

  const form = useForm<AsnLineFormValues>({
    resolver: zodResolver(asnLineSchema),
    defaultValues: {
      productId: '',
      expectedQuantity: 1,
      uomId: '',
      lotNumber: '',
      expiryDate: '',
      notes: '',
    },
  })

  const handleOpenLineDialog = useCallback(
    (line?: AsnLine) => {
      if (line) {
        setEditingLine(line)
        setSelectedProduct(undefined)
        form.reset({
          productId: line.productId,
          expectedQuantity: line.expectedQuantity,
          uomId: line.uomId,
          lotNumber: line.lotNumber ?? '',
          expiryDate: line.expiryDate ?? '',
          notes: line.notes ?? '',
        })
      } else {
        setEditingLine(null)
        setSelectedProduct(undefined)
        form.reset({
          productId: '',
          expectedQuantity: 1,
          uomId: '',
          lotNumber: '',
          expiryDate: '',
          notes: '',
        })
      }
      setLineDialogOpen(true)
    },
    [form]
  )

  const onSubmitLine = async (values: AsnLineFormValues) => {
    try {
      if (editingLine) {
        await updateLine.mutateAsync({
          id: editingLine.id,
          dto: {
            expectedQuantity: values.expectedQuantity,
            uomId: values.uomId,
            productId: values.productId,
            lotNumber: values.lotNumber || undefined,
            expiryDate: values.expiryDate || undefined,
            notes: values.notes || undefined,
          },
        })
        toast.success('ASN line updated')
      } else {
        await createLine.mutateAsync({
          asnId,
          productId: values.productId,
          expectedQuantity: values.expectedQuantity,
          uomId: values.uomId,
          lotNumber: values.lotNumber || undefined,
          expiryDate: values.expiryDate || undefined,
          notes: values.notes || undefined,
        })
        toast.success('ASN line created')
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
      toast.success('ASN line deleted')
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

  const columns: ColumnDef<AsnLine, any>[] = useMemo(
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
          <span>{row.original.expectedQuantity}</span>
        ),
      },
      {
        accessorKey: 'receivedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Received" />
        ),
        cell: ({ row }) => (
          <span>{row.original.receivedQuantity ?? 0}</span>
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
        id: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const lineStatus = getLineStatus(row.original)
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                lineStatus === 'Received'
                  ? 'bg-green-100 text-green-700'
                  : lineStatus === 'Partially Received'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {lineStatus}
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
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>ASN Lines</DialogTitle>
            <DialogDescription>
              Manage line items for ASN {asnId.slice(0, 8)}...
              {asnStatus && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      asnStatus === 'received'
                        ? 'bg-green-500'
                        : asnStatus === 'cancelled'
                          ? 'bg-destructive'
                          : asnStatus === 'in_transit'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                    }`}
                  />
                  {asnStatus.charAt(0).toUpperCase() + asnStatus.slice(1)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[460px] overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {total} line{total !== 1 ? 's' : ''}
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
                            Click "Add Line" to add expected products
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitLine as any)}>
              <DialogHeader>
                <DialogTitle>
                  {editingLine ? 'Edit ASN Line' : 'Add ASN Line'}
                </DialogTitle>
                <DialogDescription>
                  {editingLine
                    ? 'Update line item details'
                    : 'Add an expected product to this ASN'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>
                      Expected Qty <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register('expectedQuantity', { valueAsNumber: true })}
                    />
                    {form.formState.errors.expectedQuantity && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.expectedQuantity.message}
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
                    <Label>Lot Number</Label>
                    <Input
                      {...form.register('lotNumber')}
                      placeholder="e.g. LOT-2024-001"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      {...form.register('expiryDate')}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...form.register('notes')}
                    placeholder="Optional notes for this line..."
                    rows={2}
                  />
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
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!lineToDelete}
        onOpenChange={(open) => !open && setLineToDelete(null)}
        title="Delete ASN Line?"
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
