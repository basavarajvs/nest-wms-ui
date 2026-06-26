import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useInvoice, useUpdateInvoiceStatus, type Invoice, type InvoiceLine } from '@/features/billing/data/billing-queries'

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

interface Props {
  invoiceId: string
}

export function InvoiceDetailPage({ invoiceId }: Props) {
  const { data: inv, isLoading } = useInvoice(invoiceId)
  const updateStatus = useUpdateInvoiceStatus()
  const [newStatus, setNewStatus] = useState('')

  const invoice = inv as Invoice | undefined
  const lines = (inv as any)?.lines as InvoiceLine[] | undefined

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    try {
      await updateStatus.mutateAsync({ id: invoiceId, dto: { status: newStatus as any } })
      toast.success('Invoice status updated')
      setNewStatus('')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update status')
    }
  }

  if (isLoading) {
    return <div className='space-y-6'><Skeleton className='h-8 w-48' /><Skeleton className='h-32 w-full' /></div>
  }

  if (!invoice) {
    return (
      <div className='flex flex-col items-center gap-4 py-12'>
        <FileText className='h-12 w-12 text-muted-foreground/40' />
        <p className='font-medium'>Invoice Not Found</p>
        <Button variant='outline' asChild><Link to='/billing/invoices'>Back to Invoices</Link></Button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' asChild><Link to='/billing/invoices'><ArrowLeft className='h-4 w-4' /></Link></Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{invoice.invoiceNumber || invoice.id.substring(0, 12)}</h1>
          <p className='text-muted-foreground'>{invoice.clientName || invoice.clientId}</p>
        </div>
      </div>

      <div className='flex items-center gap-3 flex-wrap'>
        <Badge variant='outline' className={(STATUS_BADGE[invoice.status] || '') + ' capitalize'}>{invoice.status || 'Unknown'}</Badge>
      </div>

      <div className='grid grid-cols-3 gap-4 text-sm'>
        <div><Label>Period</Label><p className='font-medium'>{new Date(invoice.periodStart).toLocaleDateString()} – {new Date(invoice.periodEnd).toLocaleDateString()}</p></div>
        <div><Label>Due Date</Label><p className='font-medium'>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</p></div>
        <div><Label>Currency</Label><p className='font-medium'>{invoice.currency || '—'}</p></div>
        <div><Label>Subtotal</Label><p className='font-medium'>${invoice.subtotal.toFixed(2)}</p></div>
        <div><Label>Tax</Label><p className='font-medium'>{invoice.taxAmount != null ? `$${invoice.taxAmount.toFixed(2)}` : '—'}</p></div>
        <div><Label>Discount</Label><p className='font-medium'>{invoice.discountAmount != null ? `-$${invoice.discountAmount.toFixed(2)}` : '—'}</p></div>
        <div className='col-span-3'><Label>Total Amount</Label><p className='text-lg font-bold'>${invoice.totalAmount.toFixed(2)}</p></div>
      </div>

      {invoice.notes && <p className='text-sm text-muted-foreground border-l-2 border-muted pl-3'>{invoice.notes}</p>}

      {['DRAFT', 'SENT', 'OVERDUE'].includes(invoice.status) && (
        <div className='flex items-end gap-3'>
          <div className='grid gap-2'>
            <Label>Update Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className='w-40'><SelectValue placeholder='Select status' /></SelectTrigger>
              <SelectContent>
                {invoice.status === 'DRAFT' && <SelectItem value='SENT'>Mark Sent</SelectItem>}
                {invoice.status === 'SENT' && <SelectItem value='PAID'>Mark Paid</SelectItem>}
                {invoice.status === 'OVERDUE' && <SelectItem value='PAID'>Mark Paid</SelectItem>}
                <SelectItem value='CANCELLED'>Cancel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size='sm' onClick={handleStatusUpdate} disabled={!newStatus || updateStatus.isPending}>
            {updateStatus.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Update
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className='pb-3'><CardTitle className='text-base'>Line Items ({lines?.length || 0})</CardTitle></CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className='text-right'>Qty</TableHead>
                <TableHead className='text-right'>Unit Price</TableHead>
                <TableHead className='text-right'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!lines || lines.length === 0 ? (
                <TableRow><TableCell colSpan={5} className='text-center text-muted-foreground py-4'>No line items</TableCell></TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className='text-xs font-mono'>{line.lineType}</TableCell>
                    <TableCell className='text-sm'>{line.description || '—'}</TableCell>
                    <TableCell className='text-right font-mono text-xs'>{line.quantity}</TableCell>
                    <TableCell className='text-right font-mono text-xs'>${line.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className='text-right font-mono text-xs font-medium'>${line.lineTotal.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
