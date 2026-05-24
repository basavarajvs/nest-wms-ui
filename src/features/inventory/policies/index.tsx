import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Save, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { useUpsertPolicy } from './data/policy-queries'

const policySchema = z.object({
  facilityId: z.string().min(1, 'Facility ID required'),
  productId: z.string().min(1, 'Product ID required'),
  locationId: z.string().optional(),
  isActive: z.boolean().optional(),
  // Extended fields (not in current generated DTO but commonly needed)
  reorderPoint: z.coerce.number().min(0).optional(),
  safetyStock: z.coerce.number().min(0).optional(),
  maxLevel: z.coerce.number().min(0).optional(),
})

type PolicyForm = z.infer<typeof policySchema>

export function Policies() {
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const upsertMutation = useUpsertPolicy()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PolicyForm>({
    resolver: zodResolver(policySchema) as any,
    defaultValues: {
      facilityId: '',
      productId: '',
      locationId: '',
      isActive: true,
      reorderPoint: 0,
      safetyStock: 0,
      maxLevel: 0,
    },
  })

  const isActive = watch('isActive')

  const onSubmit = async (data: PolicyForm) => {
    try {
      // Only send fields present in UpsertPolicyDto to the API
      const dto = {
        facilityId: data.facilityId,
        productId: data.productId,
        locationId: data.locationId || undefined,
        isActive: data.isActive,
      }
      await upsertMutation.mutateAsync(dto as any)
      setLastSaved(new Date().toISOString())
      toast.success('Policy upserted successfully')
      // Keep form for further edits; user can change product/facility and save again
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save policy')
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Policies</h1>
        <p className="text-muted-foreground">Set reorder points, safety stock, and other rules per product/location</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" /> Upsert Policy
          </CardTitle>
          <CardDescription>
            This form calls the upsert endpoint. The generated client DTO currently only supports <code>facilityId</code>, <code>productId</code>, <code>locationId</code>, and <code>isActive</code>.
            Additional fields (reorderPoint, safetyStock, maxLevel) are collected for future backend support or direct API use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facilityId">Facility ID *</Label>
                <Input id="facilityId" {...register('facilityId')} placeholder="facility-uuid" />
                {errors.facilityId && <p className="text-sm text-destructive">{errors.facilityId.message}</p>}
              </div>
              <div>
                <Label htmlFor="productId">Product ID *</Label>
                <Input id="productId" {...register('productId')} placeholder="product-uuid" />
                {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
              </div>
              <div>
                <Label htmlFor="locationId">Location ID (optional)</Label>
                <Input id="locationId" {...register('locationId')} placeholder="location-uuid or leave blank for facility-level" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="isActive"
                  checked={!!isActive}
                  onCheckedChange={(v) => setValue('isActive', v)}
                />
                <Label htmlFor="isActive">Policy Active</Label>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-3">Policy Parameters (extended)</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input type="number" id="reorderPoint" {...register('reorderPoint')} />
                </div>
                <div>
                  <Label htmlFor="safetyStock">Safety Stock</Label>
                  <Input type="number" id="safetyStock" {...register('safetyStock')} />
                </div>
                <div>
                  <Label htmlFor="maxLevel">Max Level</Label>
                  <Input type="number" id="maxLevel" {...register('maxLevel')} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting || upsertMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {upsertMutation.isPending ? 'Saving...' : 'Save / Update Policy'}
              </Button>
              <Button type="button" variant="outline" onClick={() => reset()}>
                Reset Form
              </Button>
              {lastSaved && (
                <span className="text-xs text-green-600">Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Note: A dedicated list-policies endpoint is not currently exposed in the WMS Web API. Use this form to create or update policies by product/facility combination. Existing policies can be viewed via backend admin tools or future UI enhancements.
      </div>
    </div>
  )
}
