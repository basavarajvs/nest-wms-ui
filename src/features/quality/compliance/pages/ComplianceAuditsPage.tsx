import { useState } from 'react'
import { RefreshCw, Plus, ClipboardCheck, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuditDialog } from '@/features/quality/compliance/components/AuditDialog'

export function ComplianceAuditsPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Compliance Audits</h1>
          <p className='text-muted-foreground'>Schedule and track compliance audits</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Schedule Audit
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <ClipboardCheck className='h-4 w-4' />
            Audits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center gap-4 py-12 text-center'>
            <ClipboardCheck className='h-10 w-10 text-muted-foreground/40' />
            <div>
              <p className='font-medium'>Audit List Pending API</p>
              <p className='text-sm text-muted-foreground max-w-md'>
                The audit list endpoint is not yet available in the current API surface.
                Use the Schedule Audit button to create new audits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuditDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
