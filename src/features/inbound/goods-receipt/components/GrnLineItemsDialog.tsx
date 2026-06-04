import { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type ColumnDef, getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table'
import { Plus, Loader2, Package } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import {
  useGrnLines,
  useCreateGrnLine,
  useUpdateGrnLine,
  type GrnLine,
} from '../data/grn-line-queries'
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

const adHocLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  expectedQuantity: z.number().min(1, 'Expected qty must be at least 1'),
  receivedQuantity: z.number().min(0, 'Received qty cannot be negative'),
  uomId: z.string().min(1, 'UOM is required'),
  lotNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  damagedQuantity: z.number().min(0).optional(),
  notes: z.string().optional(),
})

type AdHocLineForm = z.infer<typeof adHocLineSchema>

interface GrnLineItemsDialogProps {
  grnId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GrnLineItemsDialog({ grnId, open, onOpenChange }: GrnLineItemsDialogProps) {
  const { data, isLoading } = useGrnLines(grnId)
  const createLine = useCreateGrnLine()
  const updateLine = useUpdateGrnLine()

  const [adHocOpen, setAdHocOpen] = useState(false)

  const lines: GrnLine[] = data?.lines ?? []
  const total = data?.total ?? 0

  const adHocForm = useForm<AdHocLineForm>({
    resolver: zodResolver(adHocLineSchema),
    defaultValues: {
      productId: '',
      expectedQuantity: 1,
      receivedQuantity: 0,
      uomId: '',
      lotNumber: '',
      expiryDate: '',
      damagedQuantity: 0,
      notes: '',
    },
  })

  const handleAdHocSubmit = useCallback(async (values: AdHocLineForm) => {
    try {
      await createLine.mutateAsync({
        grnId,
        productId: values.productId,
        expectedQuantity: values.expectedQuantity,
        receivedQuantity: values.receivedQuantity,
        uomId: values.uomId,
        lotNumber: values.lotNumber || undefined,
        expiryDate: values.expiryDate || undefined,
        damagedQuantity: values.damagedQuantity || undefined,
        notes: values.notes || undefined,
      })
      toast.success('Ad-hoc line added')
      setAdHocOpen(false)
      adHocForm.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add line')
    }
  }, [grnId, createLine, adHocForm])

  const handleReceivedQtyChange = useCallback(async (line: GrnLine, value: number) => {
    if (value < 0) return
    try {
      await updateLine.mutateAsync({
        id: line.id,
        dto: { receivedQuantity: value },
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update received qty')
    }
  }, [updateLine])

  const handleDamagedQtyChange = useCallback(async (line: GrnLine, value: number) => {
    if (value < 0) return
    try {
      await updateLine.mutateAsync({
        id: line.id,
        dto: { damagedQuantity: value },
      })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update damaged qty')
    }
  }, [updateLine])

  const handleProductSelect = useCallback(
    (_productCode: string, product?: Product) => {
      adHocForm.setValue('productId', product?.id ?? '', { shouldValidate: true })
    },
    [adHocForm]
  )

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
        id: 'receivedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Received" />
        ),
        cell: ({ row }) => {
          const line = row.original
          const rcv = line.receivedQuantity ?? 0
          return (
            <Input
              type="number"
              min={0}
              value={rcv}
              onChange={(e) => handleReceivedQtyChange(line, Number(e.target.value) || 0)}
              className="h-8 w-20"
            />
          )
        },
      },
      {
        id: 'variance',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Variance" />
        ),
        cell: ({ row }) => {
          const variance = getVariance(row.original)
          const config = VARIANCE_CONFIG[variance]
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                config.classes
              )}
            >
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
          <span className="text-xs">
            {row.original.expiryDate
              ? new Date(row.original.expiryDate).toLocaleDateString()
              : '-'}
          </span>
        ),
      },
      {
        id: 'damagedQuantity',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Damaged" />
        ),
        cell: ({ row }) => {
          const line = row.original
          const dmg = line.damagedQuantity ?? 0
          return (
            <Input
              type="number"
              min={0}
              value={dmg}
              onChange={(e) => handleDamagedQtyChange(line, Number(e.target.value) || 0)}
              className="h-8 w-16"
            />
          )
        },
      },
    ],
    [handleReceivedQtyChange, handleDamagedQtyChange]
  )

  const table = useReactTable({
    data: lines,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>GRN Lines</DialogTitle>
            <DialogDescription>
              Enter received quantities for each line. Variances are calculated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[500px] overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {total} line{total !== 1 ? 's' : ''}
              </span>
              <Button size="sm" variant="outline" onClick={() => {
                adHocForm.reset({
                  productId: '',
                  expectedQuantity: 1,
                  receivedQuantity: 0,
                  uomId: '',
                  lotNumber: '',
                  expiryDate: '',
                  damagedQuantity: 0,
                  notes: '',
                })
                setAdHocOpen(true)
              }}>
                <Plus className="mr-1 h-4 w-4" /> Add Line
              </Button>
            </div>

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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                        <span>No lines yet</span>
                      </div>
                    </TableCell>
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

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adHocOpen} onOpenChange={setAdHocOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={adHocForm.handleSubmit(handleAdHocSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Ad-hoc Line</DialogTitle>
              <DialogDescription>
                Add an unexpected product to this GRN
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>
                  Product <span className="text-destructive">*</span>
                </Label>
                <ProductSearchSelect
                  onValueChange={handleProductSelect}
                  placeholder="Search and select product..."
                />
                {adHocForm.formState.errors.productId && (
                  <p className="text-sm text-destructive">{adHocForm.formState.errors.productId.message}</p>
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
                    {...adHocForm.register('expectedQuantity', { valueAsNumber: true })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>
                    Received Qty <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    {...adHocForm.register('receivedQuantity', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>
                  UOM <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(v) => adHocForm.setValue('uomId', v)}
                  value={adHocForm.watch('uomId') ?? ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_UOMS.map((uom) => (
                      <SelectItem key={uom.value} value={uom.value}>{uom.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Lot Number</Label>
                  <Input {...adHocForm.register('lotNumber')} placeholder="e.g. LOT-001" />
                </div>
                <div className="grid gap-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" {...adHocForm.register('expiryDate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Damaged Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={0}
                    {...adHocForm.register('damagedQuantity', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes / Damage Reason</Label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...adHocForm.register('notes')}
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdHocOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLine.isPending}>
                {createLine.isPending ? 'Adding...' : 'Add Line'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
