import { useState, useMemo } from 'react'
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import {
  ClipboardCheck,
  Calendar,
  User,
  MapPin,
  Package,
  Beaker,
  Loader2,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
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
  useInspection,
  useUpdateInspection,
  type Inspection,
  type InspectionResult,
} from '@/features/quality/inspections/data/inspection-queries'
import { InspectionDialog } from './InspectionDialog'
import { InspectionResultDialog } from './InspectionResultDialog'
import { InspectionEventsPanel } from './InspectionEventsPanel'
import { STATUS_BADGE, PRIORITY_BADGE, RESULT_BADGE } from '@/features/quality/inspections/data/inspection-constants'

interface Props {
  inspectionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InspectionDetailDialog({ inspectionId, open, onOpenChange }: Props) {
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const { data: inspection, isLoading } = useInspection(inspectionId)
  const updateInspection = useUpdateInspection()

  const insp = inspection as Inspection | undefined
  const results = (inspection as any)?.results as InspectionResult[] | undefined

  const resultColumns: ColumnDef<InspectionResult, any>[] = useMemo(
    () => [
      {
        accessorKey: 'checkType',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Check Type' />,
        cell: ({ row }) => <span className='font-mono text-xs'>{row.original.checkType}</span>,
      },
      {
        accessorKey: 'result',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Result' />,
        cell: ({ row }) => {
          const cls = RESULT_BADGE[row.original.result] || ''
          return <Badge variant='outline' className={cls}>{row.original.result}</Badge>
        },
      },
      {
        accessorKey: 'measuredValue',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Measured' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs'>{row.original.measuredValue ?? '—'}</span>
        ),
      },
      {
        id: 'tolerance',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tolerance' />,
        cell: ({ row }) => {
          const min = row.original.toleranceMin
          const max = row.original.toleranceMax
          if (min == null && max == null) return <span className='text-xs text-muted-foreground'>—</span>
          return <span className='font-mono text-xs'>{min ?? '—'} – {max ?? '—'}</span>
        },
      },
      {
        accessorKey: 'notes',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Notes' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground max-w-[160px] truncate block'>{row.original.notes || '—'}</span>
        ),
      },
      {
        accessorKey: 'checkedBy',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Checked By' />,
        cell: ({ row }) => (
          <span className='text-xs text-muted-foreground'>{row.original.checkedBy || '—'}</span>
        ),
      },
    ],
    []
  )

  const resultTable = useReactTable({
    data: results || [],
    columns: resultColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateInspection.mutateAsync({ id: inspectionId, dto: { status } })
      toast.success(`Inspection ${status.toLowerCase().replace(/_/g, ' ')}`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update status')
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[800px] max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Beaker className='h-5 w-5' />
              {isLoading ? 'Loading...' : `Inspection ${insp?.inspectionNumber || insp?.id?.substring(0, 12) || ''}`}
            </DialogTitle>
            <DialogDescription>Quality inspection details and results</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-24 w-full' />
              <Skeleton className='h-32 w-full' />
            </div>
          ) : insp ? (
            <div className='space-y-6'>
              <div className='flex items-center gap-3 flex-wrap'>
                <Badge variant='outline' className={(STATUS_BADGE[insp.status] || '') + ' capitalize'}>
                  {insp.status?.replace(/_/g, ' ') || 'Unknown'}
                </Badge>
                <Badge variant='outline' className={(PRIORITY_BADGE[insp.priority] || '')}>
                  {insp.priority || '—'}
                </Badge>
                <span className='text-sm text-muted-foreground capitalize'>{insp.inspectionType?.replace(/_/g, ' ')}</span>
              </div>

              <div className='grid grid-cols-2 gap-4 text-sm'>
                {insp.productId && (
                  <div className='flex items-center gap-2'>
                    <Package className='h-4 w-4 text-muted-foreground' />
                    <span>{insp.productName || insp.productId}</span>
                  </div>
                )}
                {insp.locationId && (
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-muted-foreground' />
                    <span className='font-mono text-xs'>{insp.locationName || insp.locationId}</span>
                  </div>
                )}
                {insp.assignedToName && (
                  <div className='flex items-center gap-2'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span>{insp.assignedToName}</span>
                  </div>
                )}
                {insp.scheduledDate && (
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <span>{new Date(insp.scheduledDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {insp.notes && (
                <p className='text-sm text-muted-foreground border-l-2 border-muted pl-3'>{insp.notes}</p>
              )}

              <div className='flex gap-2 flex-wrap'>
                {insp.status === 'PENDING' && (
                  <>
                    <Button size='sm' onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={updateInspection.isPending}>
                      {updateInspection.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                      Start
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => setEditDialogOpen(true)}>
                      <Pencil className='mr-2 h-4 w-4' />
                      Edit
                    </Button>
                  </>
                )}
                {insp.status === 'IN_PROGRESS' && (
                  <>
                    <Button size='sm' onClick={() => setResultDialogOpen(true)}>
                      <ClipboardCheck className='mr-2 h-4 w-4' />
                      Record Result
                    </Button>
                    <Button size='sm' variant='outline' onClick={() => handleStatusUpdate('PASSED')} disabled={updateInspection.isPending}>
                      Complete (Pass)
                    </Button>
                    <Button size='sm' variant='destructive' onClick={() => handleStatusUpdate('FAILED')} disabled={updateInspection.isPending}>
                      Complete (Fail)
                    </Button>
                  </>
                )}
                {['PASSED', 'FAILED', 'CONDITIONAL'].includes(insp.status) && (
                  <Button size='sm' variant='outline' onClick={() => handleStatusUpdate('IN_PROGRESS')} disabled={updateInspection.isPending}>
                    Reopen
                  </Button>
                )}
              </div>

              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm'>Results ({results?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {!results || results.length === 0 ? (
                    <p className='text-sm text-muted-foreground py-4 text-center'>No results recorded</p>
                  ) : (
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          {resultTable.getHeaderGroups().map((hg) => (
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
                          {resultTable.getRowModel().rows.map((row) => (
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

              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm'>Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <InspectionEventsPanel inspectionId={inspectionId} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className='text-sm text-muted-foreground py-8 text-center'>Inspection not found</p>
          )}
        </DialogContent>
      </Dialog>

      <InspectionResultDialog
        inspectionId={inspectionId}
        open={resultDialogOpen}
        onOpenChange={setResultDialogOpen}
      />

      {insp && (
        <InspectionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editInspection={insp}
        />
      )}
    </>
  )
}
