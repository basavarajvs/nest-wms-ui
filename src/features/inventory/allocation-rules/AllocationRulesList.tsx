import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  Layers,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  TestTube,
  Ban,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { useFacility } from '@/hooks/useFacility'
import {
  useAllocationRuleList,
  useAllocationRule,
  useDeleteAllocationRule,
  useRemoveConstraint,
  useRemoveRuleLocation,
  type AllocationRule,
  type AllocationRuleConstraint,
  type AllocationRuleLocation,
} from './data/allocation-rule-queries'
import { RULE_TYPE_OPTIONS } from './data/allocation-rule-schemas'
import { AllocationRuleDialog } from './components/AllocationRuleDialog'
import { ConstraintDialog } from './components/ConstraintDialog'
import { RuleLocationDialog } from './components/RuleLocationDialog'
import { EvaluateRuleDialog } from './components/EvaluateRuleDialog'

const RULE_TYPE_FILTER_OPTIONS = RULE_TYPE_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value,
}))

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
]

function RuleDetailPanel({
  rule,
  onAddConstraint,
  onAddLocation,
}: {
  rule: AllocationRule
  onAddConstraint: (ruleId: string, ruleName: string) => void
  onAddLocation: (ruleId: string, ruleName: string) => void
}) {
  const { data: ruleDetailData, isLoading: detailLoading } = useAllocationRule(rule.id)
  const removeConstraint = useRemoveConstraint()
  const removeRuleLocation = useRemoveRuleLocation()

  const detail = (ruleDetailData as any)?.data || ruleDetailData || rule
  const constraints: AllocationRuleConstraint[] = (detail as any)?.constraints || rule.constraints || []
  const locations: AllocationRuleLocation[] = (detail as any)?.locationOverrides || rule.locationOverrides || []

  const handleRemoveConstraint = async (constraintId: string) => {
    try {
      await removeConstraint.mutateAsync({ id: rule.id, constraintId })
      toast.success('Constraint removed')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove constraint')
    }
  }

  const handleRemoveLocation = async (locationRecId: string) => {
    try {
      await removeRuleLocation.mutateAsync({ id: rule.id, locationRecId })
      toast.success('Location override removed')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove location override')
    }
  }

  if (detailLoading) {
    return (
      <div className='space-y-2 p-4'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-full' />
      </div>
    )
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='grid grid-cols-2 gap-3 rounded-lg border p-3'>
        <div>
          <p className='text-xs text-muted-foreground'>Description</p>
          <p className='text-sm'>{rule.description || '—'}</p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Priority</p>
          <p className='text-sm font-mono'>{rule.priority ?? '—'}</p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Effective Date</p>
          <p className='text-sm'>{rule.effectiveDate ? new Date(rule.effectiveDate).toLocaleDateString() : '—'}</p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Expiry Date</p>
          <p className='text-sm'>{rule.expiryDate ? new Date(rule.expiryDate).toLocaleDateString() : '—'}</p>
        </div>
      </div>

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-semibold'>
            Constraints ({constraints.length})
          </h4>
          <Button
            size='sm'
            variant='outline'
            onClick={() => onAddConstraint(rule.id, rule.ruleName || '')}
          >
            <Plus className='mr-1 h-3 w-3' />
            Add
          </Button>
        </div>
        {constraints.length === 0 ? (
          <p className='py-2 text-center text-sm text-muted-foreground'>No constraints defined.</p>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {constraints.map((c, i) => (
                  <TableRow key={c.id || i}>
                    <TableCell className='font-medium'>{c.constraintField}</TableCell>
                    <TableCell><Badge variant='outline'>{c.constraintOperator}</Badge></TableCell>
                    <TableCell className='font-mono text-xs'>{c.constraintValue}</TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => c.id && handleRemoveConstraint(c.id)}
                        disabled={removeConstraint.isPending}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-semibold'>
            Location Overrides ({locations.length})
          </h4>
          <Button
            size='sm'
            variant='outline'
            onClick={() => onAddLocation(rule.id, rule.ruleName || '')}
          >
            <Plus className='mr-1 h-3 w-3' />
            Add
          </Button>
        </div>
        {locations.length === 0 ? (
          <p className='py-2 text-center text-sm text-muted-foreground'>No location overrides defined.</p>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className='w-[80px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc, i) => (
                  <TableRow key={loc.id || i}>
                    <TableCell className='font-mono text-xs'>{loc.locationId}</TableCell>
                    <TableCell>{loc.priority ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const recId = loc.locationRecId || loc.id
                          if (recId) handleRemoveLocation(recId)
                        }}
                        disabled={removeRuleLocation.isPending}
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

const RULE_TYPE_BADGE: Record<string, string> = {
  FIFO: 'default',
  FEFO: 'secondary',
  LIFO: 'outline',
  NEAREST_LOCATION: 'destructive',
  CLIENT_PREFERRED: 'secondary',
}

export function AllocationRulesList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const { selectedFacility } = useFacility()
  const { data, isLoading, isError, error, refetch, isFetching } = useAllocationRuleList({
    facilityId: selectedFacility?.id,
  })

  const rules: AllocationRule[] = data?.rules || []

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editRule, setEditRule] = useState<AllocationRule | null>(null)
  const [deleteRule, setDeleteRule] = useState<AllocationRule | null>(null)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [constraintDialog, setConstraintDialog] = useState<{ open: boolean; ruleId: string; ruleName: string }>({
    open: false,
    ruleId: '',
    ruleName: '',
  })
  const [locationDialog, setLocationDialog] = useState<{ open: boolean; ruleId: string; ruleName: string }>({
    open: false,
    ruleId: '',
    ruleName: '',
  })
  const [evaluateDialogOpen, setEvaluateDialogOpen] = useState(false)

  const deleteMutation = useDeleteAllocationRule()

  const handleDelete = async () => {
    if (!deleteRule) return
    try {
      await deleteMutation.mutateAsync(deleteRule.id)
      toast.success('Rule deleted successfully')
      setDeleteRule(null)
      if (expandedRule === deleteRule.id) setExpandedRule(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete rule')
    }
  }

  const columns: ColumnDef<AllocationRule, any>[] = useMemo(
    () => [
      {
        accessorKey: 'ruleName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Rule Name' />
        ),
        cell: ({ row }) => (
          <div>
            <button
              className='font-medium underline-offset-4 hover:underline'
              onClick={() => setExpandedRule(expandedRule === row.original.id ? null : row.original.id)}
            >
              {row.getValue('ruleName') || '—'}
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'ruleType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => {
          const type = row.getValue('ruleType') as string
          return (
            <Badge variant={(RULE_TYPE_BADGE[type] || 'outline') as any}>
              {type || '—'}
            </Badge>
          )
        },
        filterFn: 'arrIncludesSome',
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Priority' />
        ),
        cell: ({ row }) => (
          <span className='font-mono'>{row.getValue('priority') ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Active' />
        ),
        cell: ({ row }) => {
          const active = row.getValue('isActive') as boolean
          return active ? (
            <Badge variant='default'>Active</Badge>
          ) : (
            <Badge variant='secondary'>Inactive</Badge>
          )
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          const value = row.getValue(columnId) as boolean
          if (!filterValue || filterValue.length === 0) return true
          return filterValue.includes(String(value))
        },
      },
      {
        accessorKey: 'effectiveDate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Effective' />
        ),
        cell: ({ row }) => {
          const date = row.getValue('effectiveDate') as string | undefined
          return (
            <span className='text-xs text-muted-foreground'>
              {date ? new Date(date).toLocaleDateString() : '—'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className='flex gap-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setEditRule(r)}
              >
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setConstraintDialog({ open: true, ruleId: r.id, ruleName: r.ruleName || '' })
                }}
              >
                <Ban className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setLocationDialog({ open: true, ruleId: r.id, ruleName: r.ruleName || '' })
                }}
              >
                <Layers className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setDeleteRule(r)}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          )
        },
      },
    ],
    [expandedRule]
  )

  const table = useReactTable({
    data: rules,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Allocation Rules</h1>
          <p className='text-muted-foreground'>
            Configure FIFO, FEFO, LIFO, and other inventory allocation strategies
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => setEvaluateDialogOpen(true)}
          >
            <TestTube className='mr-2 h-4 w-4' />
            Evaluate
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              refetch()
              toast.info('Refreshing rules...')
            }}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Create Rule
          </Button>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by rule name...'
        filters={[
          {
            columnId: 'ruleType',
            title: 'Rule Type',
            options: RULE_TYPE_FILTER_OPTIONS,
          },
          {
            columnId: 'isActive',
            title: 'Status',
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Rules {rules.length ? `(${rules.length})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-9 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load rules</p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : rules.length === 0 && !expandedRule ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/30' />
              <p className='font-medium text-muted-foreground'>
                No allocation rules found
              </p>
              <Button size='sm' onClick={() => setCreateDialogOpen(true)}>
                <Plus className='mr-2 h-4 w-4' />
                Create your first rule
              </Button>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
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
                    {table.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className='py-8 text-center text-muted-foreground'>
                          No rules match the current filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <>
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                          {expandedRule === row.original.id && (
                            <TableRow key={`${row.id}-detail`}>
                              <TableCell colSpan={columns.length} className='bg-muted/30 p-0'>
                                <RuleDetailPanel
                                  rule={row.original}
                                  onAddConstraint={(ruleId, ruleName) =>
                                    setConstraintDialog({ open: true, ruleId, ruleName })
                                  }
                                  onAddLocation={(ruleId, ruleName) =>
                                    setLocationDialog({ open: true, ruleId, ruleName })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <AllocationRuleDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) setEditRule(null)
        }}
      />

      {editRule && (
        <AllocationRuleDialog
          open={!!editRule}
          onOpenChange={(open) => {
            if (!open) setEditRule(null)
          }}
          rule={editRule}
        />
      )}

      <ConstraintDialog
        ruleId={constraintDialog.ruleId}
        ruleName={constraintDialog.ruleName}
        open={constraintDialog.open}
        onOpenChange={(open) => setConstraintDialog((prev) => ({ ...prev, open }))}
      />

      <RuleLocationDialog
        ruleId={locationDialog.ruleId}
        ruleName={locationDialog.ruleName}
        open={locationDialog.open}
        onOpenChange={(open) => setLocationDialog((prev) => ({ ...prev, open }))}
      />

      <EvaluateRuleDialog
        open={evaluateDialogOpen}
        onOpenChange={setEvaluateDialogOpen}
      />

      <AlertDialog open={!!deleteRule} onOpenChange={(open) => { if (!open) setDeleteRule(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Allocation Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteRule?.ruleName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
