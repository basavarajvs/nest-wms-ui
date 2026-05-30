import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RefreshCw, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  usePolicies,
  useCreatePolicy,
  type Policy,
} from '@/features/inventory/policies/data/policy-queries'
import { useFacility } from '@/hooks/useFacility'

const policySchema = z.object({
  productSku: z.string().min(1, 'Product SKU is required'),
  reorderPoint: z.coerce.number().min(0).optional(),
  safetyStock: z.coerce.number().min(0).optional(),
  maxStock: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
})

type PolicyForm = z.infer<typeof policySchema>

const POLICY_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'reorder', label: 'Reorder' },
  { value: 'safety_stock', label: 'Safety Stock' },
  { value: 'min_max', label: 'Min/Max' },
]

export function PolicyList() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [typeFilter, setTypeFilter] = useState('')
  const [productSku, setProductSku] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, isError, error, refetch, isFetching } = usePolicies({
    page,
    limit,
    type: typeFilter || undefined,
    productSku: productSku || undefined,
  })
  const createMutation = useCreatePolicy()
  const { selectedFacility } = useFacility()

  const form = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: { productSku: '', reorderPoint: undefined, safetyStock: undefined, maxStock: undefined, notes: '' },
  })

  const policies: Policy[] = data?.policies || []
  const total = data?.total ?? policies.length

  const onCreateSubmit = async (formData: PolicyForm) => {
    if (!selectedFacility) {
      toast.error('Please select a facility from the top bar first')
      return
    }
    try {
      await createMutation.mutateAsync({
        facilityId: selectedFacility.id,
        productSku: formData.productSku,
        reorderPoint: formData.reorderPoint,
        safetyStock: formData.safetyStock,
        maxStock: formData.maxStock,
        notes: formData.notes || undefined,
      })
      toast.success('Policy created')
      setDialogOpen(false)
      form.reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create policy')
    }
  }

  const handleFilterReset = () => {
    setTypeFilter('')
    setProductSku('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Policies</h1>
          <p className="text-muted-foreground">
            Configure reorder points, safety stock, and min/max levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Product SKU</Label>
              <Input value={productSku} onChange={(e) => { setProductSku(e.target.value); setPage(1) }} placeholder="SKU..." />
            </div>
            <div className="grid gap-2">
              <Label>Policy Type</Label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {POLICY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleFilterReset}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Policies {total ? `(${total})` : ''}</CardTitle>
          <CardDescription>
            {selectedFacility ? `Facility: ${selectedFacility.facilityCode} — ${selectedFacility.facilityName}` : 'Select a facility from the top bar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load policies</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">No policies found</p>
              <p className="text-sm text-muted-foreground max-w-md">Create policies for your products to manage replenishment rules.</p>
              <Button size="sm" onClick={() => setDialogOpen(true)}>Create First Policy</Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Reorder Pt</TableHead>
                      <TableHead className="text-right">Safety Stock</TableHead>
                      <TableHead className="text-right">Max Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.productSku || p.productId || '—'}</TableCell>
                        <TableCell className="capitalize">{p.policyType || '—'}</TableCell>
                        <TableCell className="text-right font-mono">{p.reorderPoint ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono">{p.safetyStock ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono">{p.maxStock ?? '—'}</TableCell>
                        <TableCell><Badge variant={p.enabled === false ? 'secondary' : 'default'}>{p.enabled === false ? 'disabled' : 'active'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">Page {page} ({total} total)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={form.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Inventory Policy</DialogTitle>
              <DialogDescription>
                Set replenishment parameters for a product at the current facility.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedFacility && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="policyProductSku">Product SKU *</Label>
                <Input id="policyProductSku" {...form.register('productSku')} placeholder="e.g. SKU-001" />
                {form.formState.errors.productSku && <p className="text-sm text-destructive">{form.formState.errors.productSku.message}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input id="reorderPoint" type="number" min="0" {...form.register('reorderPoint')} placeholder="10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="safetyStock">Safety Stock</Label>
                  <Input id="safetyStock" type="number" min="0" {...form.register('safetyStock')} placeholder="5" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input id="maxStock" type="number" min="0" {...form.register('maxStock')} placeholder="100" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="policyNotes">Notes</Label>
                <Textarea id="policyNotes" {...form.register('notes')} rows={2} placeholder="Optional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create Policy'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
