import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  RefreshCw,
  Plus,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import {
  useHazmatList,
  type HazmatMaterial,
} from '@/features/quality/hazmat/data/hazmat-queries'
import { HazmatDialog } from '@/features/quality/hazmat/components/HazmatDialog'
import { useFacility } from '@/hooks/useFacility'

const HAZARD_CLASS_NAMES: Record<string, string> = {
  '1': 'Explosives',
  '2': 'Gases',
  '3': 'Flammable Liquids',
  '4': 'Flammable Solids',
  '5': 'Oxidizers',
  '6': 'Toxic',
  '7': 'Radioactive',
  '8': 'Corrosives',
  '9': 'Miscellaneous',
}

export function HazmatMaterialsPage() {
  const { selectedFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [classFilter, setClassFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useHazmatList({
    hazardClass: classFilter || undefined,
    facilityId: selectedFacility?.id || undefined,
  })

  const materials: HazmatMaterial[] = data?.materials || []

  const columns: ColumnDef<HazmatMaterial, any>[] = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
        cell: ({ row }) => (
          <span className='text-sm font-medium'>{row.original.productName || row.original.productId}</span>
        ),
      },
      {
        accessorKey: 'hazardClass',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Class' />,
        cell: ({ row }) => {
          const cls = row.original.hazardClass
          const name = HAZARD_CLASS_NAMES[cls]
          return (
            <Badge variant='outline' className='bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'>
              {cls}{name ? ` — ${name}` : ''}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'unNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title='UN Number' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.unNumber}</span>,
      },
      {
        accessorKey: 'properShippingName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Shipping Name' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.properShippingName}</span>,
      },
      {
        accessorKey: 'packingGroup',
        header: ({ column }) => <DataTableColumnHeader column={column} title='PG' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>{row.original.packingGroup || '—'}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive !== false ? 'default' : 'secondary'}>
            {row.original.isActive !== false ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: materials,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Hazmat Materials</h1>
          <p className='text-muted-foreground'>Hazardous materials inventory and compliance data</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Register Material
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <AlertTriangle className='h-4 w-4' />
            Registered Materials
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid max-w-xs gap-2'>
            <Label>Hazard Class</Label>
            <Select value={classFilter} onValueChange={(v) => setClassFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder='All Classes' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Classes</SelectItem>
                {Object.entries(HAZARD_CLASS_NAMES).map(([cls, name]) => (
                  <SelectItem key={cls} value={cls}>{cls} — {name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium text-destructive'>Failed to load materials</p>
                <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : materials.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertTriangle className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Hazmat Materials</p>
                <p className='text-sm text-muted-foreground'>No hazardous materials registered</p>
              </div>
            </div>
          ) : (
            <div className='rounded-md border'>
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

      <HazmatDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
