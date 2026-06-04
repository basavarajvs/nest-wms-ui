import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Search, Barcode, Package, MapPin, Calendar, User, Layers, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useFindLpnByNumber,
  useLpnHierarchy,
  useLpnMovementHistory,
  type Lpn,
  type LpnHierarchyNode,
  type LpnMovement,
} from '@/features/lpns/data/lpn-queries'
import { LpnBarcodeDialog } from '@/features/lpns/components/LpnBarcodeDialog'

const LPN_TYPE_BADGE: Record<string, string> = {
  PALLET: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CASE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  EACH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CARTON: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  MIXED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const LPN_STATUS_BADGE: Record<string, string> = {
  RECEIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_STAGING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_QC: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PUTAWAY_PENDING: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  STORED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  QUARANTINED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONSUMED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  DISPOSED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  NESTED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

function LpnStatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant='outline'>—</Badge>
  const cls = LPN_STATUS_BADGE[status] || ''
  return (
    <Badge variant='outline' className={`${cls} capitalize`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

function LpnTypeBadge({ lpnType }: { lpnType?: string }) {
  if (!lpnType) return <Badge variant='outline'>—</Badge>
  const cls = LPN_TYPE_BADGE[lpnType] || ''
  return (
    <Badge variant='outline' className={cls}>
      {lpnType}
    </Badge>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-baseline justify-between gap-4 py-1.5'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  )
}

function HierarchyTree({ node, depth = 0 }: { node: LpnHierarchyNode; depth?: number }) {
  return (
    <div>
      <div
        className='flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50'
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <Layers className='h-3.5 w-3.5 text-muted-foreground' />
        <span className='font-mono text-sm font-medium'>{node.lpnNumber}</span>
        {node.lpnType && <LpnTypeBadge lpnType={node.lpnType} />}
        <span className='text-xs text-muted-foreground'>
          Qty: {node.quantity ?? '—'}
        </span>
        {node.productName && (
          <span className='text-xs text-muted-foreground'>{node.productName}</span>
        )}
      </div>
      {node.children?.map((child) => (
        <HierarchyTree key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export function LpnInquiryDashboard() {
  const [lpnNumber, setLpnNumber] = useState('')
  const [searchedLpn, setSearchedLpn] = useState('')
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false)
  const [movementSorting, setMovementSorting] = useState<SortingState>([])

  const { data: lpnResult, isLoading, isError, error, refetch } = useFindLpnByNumber(searchedLpn)
  const lpn = lpnResult as Lpn | undefined

  const { data: hierarchyData } = useLpnHierarchy(lpn?.id || '')
  const hierarchyRoot = hierarchyData as LpnHierarchyNode | undefined

  const { data: movements = [] } = useLpnMovementHistory(lpn?.id || '')

  const movementColumns: ColumnDef<LpnMovement, any>[] = useMemo(
    () => [
      {
        accessorKey: 'fromLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='From' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.fromLocationName || row.original.fromLocationId}</span>
        ),
      },
      {
        id: 'arrow',
        header: '',
        cell: () => <ArrowRight className='h-3.5 w-3.5 text-muted-foreground' />,
        enableSorting: false,
      },
      {
        accessorKey: 'toLocationName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='To' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.toLocationName || row.original.toLocationId}</span>
        ),
      },
      {
        accessorKey: 'movedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Date' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>
            {new Date(row.original.movedAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: 'movedBy',
        header: ({ column }) => <DataTableColumnHeader column={column} title='User' />,
        cell: ({ row }) => (
          <span className='flex items-center gap-1 text-xs'>
            <User className='h-3 w-3 text-muted-foreground shrink-0' />
            {row.original.movedBy}
          </span>
        ),
      },
    ],
    []
  )

  const movementTable = useReactTable({
    data: movements as LpnMovement[],
    columns: movementColumns,
    state: { sorting: movementSorting },
    onSortingChange: setMovementSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lpnNumber.trim()) {
      toast.error('Please enter an LPN number')
      return
    }
    setSearchedLpn(lpnNumber.trim())
  }

  return (
    <div className='space-y-6'>
      {/* Search Header */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Search className='h-5 w-5' />
            LPN Inquiry
          </CardTitle>
          <CardDescription>
            Search by license plate number to view details, contents, and history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className='flex gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={lpnNumber}
                onChange={(e) => setLpnNumber(e.target.value)}
                placeholder='Enter LPN number (e.g., LPN-001234)...'
                className='pl-9'
              />
            </div>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Searching
                </>
              ) : (
                <>
                  <Search className='mr-2 h-4 w-4' />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {searchedLpn && (
        <>
          {isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-48 w-full' />
              <Skeleton className='h-32 w-full' />
            </div>
          ) : isError ? (
            <Card>
              <CardContent className='flex flex-col items-center gap-3 py-12 text-center'>
                <Package className='h-12 w-12 text-muted-foreground/40' />
                <p className='font-medium text-destructive'>Failed to load LPN</p>
                <p className='text-sm text-muted-foreground'>
                  {(error as any)?.message || `LPN "${searchedLpn}" not found or an error occurred`}
                </p>
                <Button variant='outline' size='sm' onClick={() => refetch()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : !lpn ? (
            <Card>
              <CardContent className='flex flex-col items-center gap-3 py-12 text-center'>
                <Package className='h-12 w-12 text-muted-foreground/40' />
                <p className='font-medium text-muted-foreground'>LPN Not Found</p>
                <p className='text-sm text-muted-foreground'>
                  No LPN matches &ldquo;{searchedLpn}&rdquo;
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* LPN Details Card */}
              <Card>
                <CardHeader className='flex flex-row items-center justify-between pb-3'>
                  <div>
                    <CardTitle className='flex items-center gap-2 text-lg'>
                      <Package className='h-5 w-5' />
                      {lpn.lpnNumber}
                    </CardTitle>
                    <CardDescription>LPN Detail Information</CardDescription>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setBarcodeDialogOpen(true)}
                  >
                    <Barcode className='mr-2 h-4 w-4' />
                    Barcode
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2'>
                    <DetailRow label='LPN Number' value={lpn.lpnNumber} />
                    <DetailRow label='Type' value={<LpnTypeBadge lpnType={lpn.lpnType} />} />
                    <DetailRow label='Status' value={<LpnStatusBadge status={lpn.status} />} />
                    <DetailRow label='Location' value={
                      <span className='flex items-center gap-1'>
                        <MapPin className='h-3.5 w-3.5 text-muted-foreground' />
                        {lpn.locationId || '—'}
                      </span>
                    } />
                    <DetailRow label='Product ID' value={lpn.productId || '—'} />
                    <DetailRow label='Quantity' value={lpn.quantity ?? '—'} />
                    <DetailRow label='Lot/Serial' value={lpn.lotNumber || '—'} />
                    <DetailRow label='Parent LPN' value={
                      lpn.parentLpnId ? (
                        <span className='font-mono text-xs'>{lpn.parentLpnId}</span>
                      ) : (
                        <span className='text-xs text-muted-foreground'>None (top-level)</span>
                      )
                    } />
                    <DetailRow label='Created' value={
                      lpn.createdAt
                        ? new Date(lpn.createdAt).toLocaleDateString()
                        : '—'
                    } />
                    <DetailRow label='Updated' value={
                      lpn.updatedAt
                        ? new Date(lpn.updatedAt).toLocaleDateString()
                        : '—'
                    } />
                  </div>
                </CardContent>
              </Card>

              {/* Contents / Hierarchy */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Layers className='h-4 w-4' />
                    Contents
                  </CardTitle>
                  <CardDescription>
                    Nested LPN hierarchy under this license plate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!hierarchyRoot ? (
                    <div className='flex flex-col items-center gap-3 py-8 text-center'>
                      <Package className='h-8 w-8 text-muted-foreground/30' />
                      <p className='text-sm text-muted-foreground'>Loading hierarchy...</p>
                    </div>
                  ) : hierarchyRoot.children && hierarchyRoot.children.length > 0 ? (
                    <div className='rounded-md border'>
                      <HierarchyTree node={hierarchyRoot} />
                    </div>
                  ) : (
                    <div className='flex flex-col items-center gap-3 py-8 text-center'>
                      <Package className='h-8 w-8 text-muted-foreground/30' />
                      <p className='text-sm font-medium text-muted-foreground'>No nested LPNs</p>
                      <p className='text-xs text-muted-foreground'>
                        This LPN has no children
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Movement History Timeline */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                    <Calendar className='h-4 w-4' />
                    Movement History
                  </CardTitle>
                  <CardDescription>
                    Recent moves and location changes (last 7 days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {movementTable.getRowModel().rows.length === 0 ? (
                    <div className='flex flex-col items-center gap-3 py-8 text-center'>
                      <MapPin className='h-8 w-8 text-muted-foreground/30' />
                      <p className='text-sm font-medium text-muted-foreground'>No movement history</p>
                      <p className='text-xs text-muted-foreground'>
                        Movement tracking endpoint not yet available
                      </p>
                    </div>
                  ) : (
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          {movementTable.getHeaderGroups().map((hg) => (
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
                          {movementTable.getRowModel().rows.map((row) => (
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
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <LpnBarcodeDialog
        lpnNumber={lpn?.lpnNumber || ''}
        open={barcodeDialogOpen}
        onOpenChange={setBarcodeDialogOpen}
      />
    </div>
  )
}
