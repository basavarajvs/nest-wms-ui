import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  type ColumnDef, type SortingState, getCoreRowModel, getSortedRowModel, useReactTable, flexRender,
} from '@tanstack/react-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { useEscalationRuleList, type EscalationRule } from '@/features/exception-management/data/exception-queries'
import { EscalationRuleDialog } from '@/features/exception-management/components/EscalationRuleDialog'
import { useFacility } from '@/hooks/useFacility'

export function EscalationRulesPage() {
  const { currentFacility } = useFacility()
  const [open, setOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const { data, isLoading, error, refetch } = useEscalationRuleList({ facilityId: currentFacility?.id || '' })

  const rules = data?.rules || []

  const columns: ColumnDef<EscalationRule>[] = [
    {
      accessorKey: 'ruleName',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Rule Name' />,
    },
    {
      accessorKey: 'exceptionType',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Exception Type' />,
    },
    {
      accessorKey: 'severityMinimum',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Min Severity' />,
      cell: ({ row }) => <SeverityBadge severity={row.original.severityMinimum} />,
    },
    {
      accessorKey: 'unresolvedHours',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Unresolved Hours' />,
      cell: ({ row }) => `${row.original.unresolvedHours}h`,
    },
    {
      accessorKey: 'escalateToUserId',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Escalate To' />,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title='Active' />,
      cell: ({ row }) => row.original.isActive ? <Badge className='bg-green-100 text-green-800'>Active</Badge> : <Badge variant='outline'>Inactive</Badge>,
    },
  ]

  const table = useReactTable({
    data: rules,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className='space-y-4 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Escalation Rules</h1>
          <p className='text-sm text-muted-foreground'>Define when exceptions escalate to specific users</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className='mr-2 h-4 w-4' />Create Rule</Button>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>Loading...</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8'>
                <div className='flex flex-col items-center gap-2'>
                  <p className='text-destructive text-sm'>Failed to load escalation rules</p>
                  <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
                </div>
              </TableCell></TableRow>
            ) : rules.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className='text-center py-8 text-muted-foreground'>No escalation rules defined.</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <EscalationRuleDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, string> = {
    Critical: 'bg-red-100 text-red-800',
    High: 'bg-orange-100 text-orange-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-gray-100 text-gray-800',
  }
  return <Badge className={config[severity] || ''}>{severity}</Badge>
}
