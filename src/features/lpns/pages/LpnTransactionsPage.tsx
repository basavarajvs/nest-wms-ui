import { History } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LpnTransactionPanel } from '@/features/lpns/components/LpnTransactionPanel'
import { useFacility } from '@/hooks/useFacility'

export function LpnTransactionsPage() {
  const { selectedFacility } = useFacility()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>LPN Transactions</h1>
          <p className='text-muted-foreground'>
            Audit trail of LPN-level stock movements and adjustments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <History className='h-4 w-4' />
            Transaction History
          </CardTitle>
          <CardDescription>
            {selectedFacility
              ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}`
              : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LpnTransactionPanel />
        </CardContent>
      </Card>
    </div>
  )
}
