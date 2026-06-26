import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { RefreshCw, Plus, ClipboardList, AlertCircle } from 'lucide-react'
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
  useRequirementList,
  type ComplianceRequirement,
} from '@/features/quality/compliance/data/compliance-queries'
import { RequirementDialog } from '@/features/quality/compliance/components/RequirementDialog'
import { useFacility } from '@/hooks/useFacility'

const COMPLIANCE_BADGE: Record<string, string> = {
  FDA: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  OSHA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ISO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CUSTOM: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const FREQUENCY_BADGE: Record<string, string> = {
  ONCE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  DAILY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  WEEKLY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MONTHLY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  QUARTERLY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ANNUAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function ComplianceRequirementsPage() {
  const { selectedFacility } = useFacility()
  const [sorting, setSorting] = useState<SortingState>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = useRequirementList({
    complianceType: typeFilter || undefined,
    facilityId: selectedFacility?.id || undefined,
  })

  const requirements: ComplianceRequirement[] = data?.requirements || []

  const columns: ColumnDef<ComplianceRequirement, any>[] = useMemo(
    () => [
      {
        accessorKey: 'complianceType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
        cell: ({ row }) => {
          const cls = COMPLIANCE_BADGE[row.original.complianceType] || ''
          return <Badge variant='outline' className={cls}>{row.original.complianceType}</Badge>
        },
      },
      {
        accessorKey: 'requirementCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-mono text-xs font-medium'>{row.original.requirementCode}</span>,
      },
      {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
        cell: ({ row }) => <span className='text-sm'>{row.original.description}</span>,
      },
      {
        accessorKey: 'applicableEntity',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Applies To' />,
        cell: ({ row }) => (
          <span className='text-xs capitalize text-muted-foreground'>{row.original.applicableEntity || '—'}</span>
        ),
      },
      {
        accessorKey: 'frequencyType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Frequency' />,
        cell: ({ row }) => {
          const cls = FREQUENCY_BADGE[row.original.frequencyType || ''] || ''
          return <Badge variant='outline' className={cls}>{row.original.frequencyType || '—'}</Badge>
        },
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: requirements,
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
          <h1 className='text-2xl font-bold tracking-tight'>Compliance Requirements</h1>
          <p className='text-muted-foreground'>Regulatory and quality compliance requirements</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            New Requirement
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ClipboardList className='h-4 w-4' />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid max-w-xs gap-2'>
            <Label>Compliance Type</Label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder='All Types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='FDA'>FDA</SelectItem>
                <SelectItem value='OSHA'>OSHA</SelectItem>
                <SelectItem value='ISO'>ISO</SelectItem>
                <SelectItem value='CUSTOM'>Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className='h-9 w-full' />)}</div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <AlertCircle className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium text-destructive'>Failed to load requirements</p>
                <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An error occurred'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : requirements.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-12 text-center'>
              <ClipboardList className='h-10 w-10 text-muted-foreground/40' />
              <div>
                <p className='font-medium'>No Requirements</p>
                <p className='text-sm text-muted-foreground'>No compliance requirements configured</p>
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

      <RequirementDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
