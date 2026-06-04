import { useState, useMemo, useCallback } from 'react'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useOrders, type Order } from '@/features/outbound/orders/data/order-queries'
import { useCreateWave } from '../data/wave-queries'

interface WaveCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaveCreateDialog({ open, onOpenChange }: WaveCreateDialogProps) {
  const { selectedFacility } = useFacility()
  const createWave = useCreateWave()
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    page: 1,
    limit: 100,
    status: '',
    clientCode: '',
  })
  const orders: Order[] = ordersData?.orders || []

  const availableOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status?.toLowerCase() === 'created' ||
          o.status?.toLowerCase() === 'validated' ||
          o.status?.toLowerCase() === 'allocated'
      ),
    [orders]
  )

  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(
    () =>
      !search
        ? availableOrders
        : availableOrders.filter(
            (o) =>
              (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
              (o.clientCode || '').toLowerCase().includes(search.toLowerCase())
          ),
    [availableOrders, search]
  )

  const toggleOrder = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = filtered.every((o) => prev.has(o.id))
      if (allSelected) {
        const next = new Set(prev)
        filtered.forEach((o) => next.delete(o.id))
        return next
      }
      const next = new Set(prev)
      filtered.forEach((o) => next.add(o.id))
      return next
    })
  }, [filtered])

  const columns: ColumnDef<Order, any>[] = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <div
            className='flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-muted-foreground/30'
            onClick={(e) => { e.stopPropagation(); toggleAll() }}
          >
            {filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id)) && (
              <Check className='h-3 w-3' />
            )}
          </div>
        ),
        cell: ({ row }) => {
          const isSelected = selectedIds.has(row.original.id)
          return (
            <div
              className={cn(
                'flex h-5 w-5 cursor-pointer items-center justify-center rounded border',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && <Check className='h-3 w-3' />}
            </div>
          )
        },
      },
      {
        accessorKey: 'orderNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Order #' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>
            {row.getValue('orderNumber') || row.original.id.substring(0, 12) + '...'}
          </span>
        ),
      },
      {
        accessorKey: 'clientCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Client' />,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => (
          <Badge variant='outline' className='text-xs'>
            {row.getValue('status') || '—'}
          </Badge>
        ),
      },
    ],
    [filtered, selectedIds, toggleAll]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCreate = async () => {
    if (!selectedFacility) {
      toast.error('No facility selected.')
      return
    }
    if (selectedIds.size === 0) {
      toast.error('Select at least one order.')
      return
    }
    try {
      await createWave.mutateAsync({
        facilityId: selectedFacility.id,
        orderIds: Array.from(selectedIds),
      })
      toast.success(`Wave created with ${selectedIds.size} order(s)`)
      setSelectedIds(new Set())
      setSearch('')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create wave')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setSelectedIds(new Set())
          setSearch('')
        }
        onOpenChange(val)
      }}
    >
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Create Picking Wave</DialogTitle>
          <DialogDescription>
            Select orders to include in this wave.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          {selectedFacility && (
            <div className='rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground'>
              Facility:{' '}
              <span className='font-medium text-foreground'>
                {selectedFacility.facilityCode} — {selectedFacility.facilityName}
              </span>
            </div>
          )}
          <div className='grid gap-2'>
            <Label>Search Orders</Label>
            <Input
              placeholder='Filter by order # or client...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className='text-sm text-muted-foreground'>
            {selectedIds.size} of {availableOrders.length} orders selected
          </div>
          <div className='max-h-[300px] overflow-y-auto rounded-md border'>
            {ordersLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            ) : filtered.length === 0 ? (
              <div className='py-8 text-center text-sm text-muted-foreground'>
                {search ? 'No matching orders.' : 'No unassigned orders available.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map((h) => (
                        <TableHead key={h.id}>
                          {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        'cursor-pointer',
                        selectedIds.has(row.original.id) && 'bg-primary/5'
                      )}
                      onClick={() => toggleOrder(row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createWave.isPending || selectedIds.size === 0}
          >
            {createWave.isPending ? 'Creating...' : `Create Wave (${selectedIds.size} orders)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
