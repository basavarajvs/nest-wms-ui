import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export function Transactions() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Transactions</h1>
        <p className="text-muted-foreground">Audit trail of all stock movements and adjustments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" /> Endpoint Not Available
          </CardTitle>
          <CardDescription>
            There is currently no <code>/api/v1/wms/web/inventory/transactions</code> (or equivalent) listing endpoint exposed in the generated WMS Web API client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Transaction history is typically available through:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>SaaS Core platform audit logs (general event history)</li>
            <li>Per-product or per-location movement history (via future dedicated endpoints)</li>
            <li>Adjustment records (see Adjustments page for approved changes)</li>
          </ul>
          <p className="text-muted-foreground pt-2">
            Once the backend exposes a transaction listing endpoint (e.g. <code>InventoryTransactionController</code> or via the web inventory surface), this page will be updated to fetch and display paginated, filterable transaction rows with type, reference, before/after quantities, user, and timestamp.
          </p>
          <div className="pt-4 text-xs border-t">
            In the meantime, you can view recent adjustments on the Adjustments page and low-level stock changes via the Stock Levels page after operations.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
