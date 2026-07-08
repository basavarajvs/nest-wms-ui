import { useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAsnById,
  useAsnLines,
  ASN_STATUS_LABELS,
} from '@/features/asns/data/asn-queries'
import { DataTableLoading } from '@/components/data-table/data-table'

interface AsnDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asnId: string | null
}

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'CREATED':
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'IN_TRANSIT':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'ARRIVED':
    case 'IN_RECEIVING':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'PARTIALLY_RECEIVED':
    case 'RECEIVED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return ''
  }
}

export function AsnDetailDrawer({ open, onOpenChange, asnId }: AsnDetailDrawerProps) {
  const { data: asn, isLoading: asnLoading } = useAsnById(asnId ?? '')
  const { data: linesData, isLoading: linesLoading } = useAsnLines(asnId ?? '')
  const isLoading = asnLoading || linesLoading

  const lines = useMemo(() => {
    if (!linesData) return []
    return Array.isArray(linesData) ? linesData : []
  }, [linesData])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>ASN Details</SheetTitle>
          <SheetDescription>
            {asn?.asn_number ? `#${asn.asn_number}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {isLoading ? (
            <DataTableLoading columns={4} />
          ) : asn ? (
            <div className="space-y-6">
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Header</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">ASN Number:</span>
                    <span className="ml-2 font-medium">{asn.asn_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <span className="ml-2 font-medium">{asn.client_name || asn.inbound_for_client_id || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vendor:</span>
                    <span className="ml-2 font-medium">{asn.vendor_name || asn.vendor_id || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PO Number:</span>
                    <span className="ml-2 font-medium">{asn.po_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected Arrival:</span>
                    <span className="ml-2 font-medium">
                      {asn.expected_arrival_date ? new Date(asn.expected_arrival_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shipment Date:</span>
                    <span className="ml-2 font-medium">
                      {asn.shipment_date ? new Date(asn.shipment_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={statusBadgeClass(asn.status)} variant="outline">
                      {ASN_STATUS_LABELS[asn.status] || asn.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carrier:</span>
                    <span className="ml-2 font-medium">{asn.carrier_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tracking #:</span>
                    <span className="ml-2 font-medium">{asn.tracking_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="ml-2 font-medium">{asn.volume ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="ml-2 font-medium">{asn.weight ?? '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 font-medium">{asn.notes || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Lines ({lines.length})</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Expected</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Lot #</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No lines found
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((line) => (
                          <TableRow key={line.asn_line_id}>
                            <TableCell className="font-medium">{line.product_name || line.product_id}</TableCell>
                            <TableCell>{line.expected_quantity}</TableCell>
                            <TableCell>{line.received_quantity ?? '-'}</TableCell>
                            <TableCell>{line.uom_name || line.uom_id}</TableCell>
                            <TableCell className="text-xs">{line.lot_number || '-'}</TableCell>
                            <TableCell className="text-xs">
                              {line.expiry_date ? new Date(line.expiry_date).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusBadgeClass(line.line_status)}>
                                {ASN_STATUS_LABELS[line.line_status] || line.line_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">ASN not found</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
