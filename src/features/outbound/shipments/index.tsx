import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

import { useGenerateManifest } from './data/shipment-queries'

const manifestSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  carrierCode: z.string().optional(),
})

type ManifestForm = z.infer<typeof manifestSchema>

export function Shipments() {
  const [result, setResult] = useState<any>(null)
  const generateMutation = useGenerateManifest()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManifestForm>({
    resolver: zodResolver(manifestSchema) as any,
    defaultValues: { shipmentId: '', carrierCode: '' },
  })

  const onGenerate = async (data: ManifestForm) => {
    try {
      const res = await generateMutation.mutateAsync({
        shipmentId: data.shipmentId,
        carrierCode: data.carrierCode || undefined,
      })
      setResult(res)
      toast.success('Manifest generated successfully')
      reset()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate manifest')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
        <p className="text-muted-foreground">Shipment management and manifest generation</p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 text-sm text-amber-800">
          <strong>Note:</strong> Full shipment listing is not currently exposed in the Web API client.
          The primary outbound shipment action available is manifest generation (below).
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Manifest</CardTitle>
          <CardDescription>OutboundWebController_generateManifest</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onGenerate)} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="shipmentId">Shipment ID *</Label>
              <Input id="shipmentId" {...register('shipmentId')} placeholder="shipment-uuid or number" />
              {errors.shipmentId && <p className="text-sm text-destructive">{errors.shipmentId.message}</p>}
            </div>
            <div>
              <Label htmlFor="carrierCode">Carrier Code</Label>
              <Input id="carrierCode" {...register('carrierCode')} placeholder="DHL, UPS, etc." />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Generate Manifest'}
            </Button>
          </form>

          {generateMutation.isPending && <Skeleton className="mt-4 h-24 w-full" />}

          {result && (
            <div className="mt-6 rounded-md border bg-muted p-4">
              <div className="font-medium mb-2">Manifest Result</div>
              <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Shipments
