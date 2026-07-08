import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReceiveAsnWizard } from '@/features/inbound/components/receive-asn-wizard'

export const Route = createFileRoute('/_authenticated/inbound/receive-asn')({
  component: ReceiveAsnPage,
})

function ReceiveAsnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Receive ASN</h1>
        <p className="text-sm text-muted-foreground">
          Search for an ASN by number, enter receipt quantities, and complete the goods receipt.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ASN Receiving Wizard</CardTitle>
        </CardHeader>
        <CardContent>
          <ReceiveAsnWizard />
        </CardContent>
      </Card>
    </div>
  )
}
