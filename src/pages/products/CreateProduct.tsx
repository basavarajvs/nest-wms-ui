import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateProduct } from '@/features/items/products/data/product-queries'
import { CodeInput } from '@/components/common/forms/CodeInput'
import { NameInput } from '@/components/common/forms/NameInput'
import { DescriptionTextarea } from '@/components/common/forms/DescriptionTextarea'
import { UomSelect } from '@/components/common/forms/UomSelect'
import { VelocityClassSelect } from '@/components/common/forms/VelocityClassSelect'

const productSchema = z.object({
  productCode: z
    .string()
    .min(1, 'Product code is required')
    .max(50, 'Product code must be 50 characters or less'),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  baseUomId: z.string().min(1, 'Base UOM is required'),
  categoryId: z.string().optional().or(z.literal('')),
  productType: z.string().optional().or(z.literal('')),
  weight: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  volume: z.coerce.number().optional(),
  unitWeight: z.coerce.number().optional(),
  storageRequirements: z.string().optional().or(z.literal('')),
  hazardousClass: z.string().optional().or(z.literal('')),
  storageConditions: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  manufacturer: z.string().optional().or(z.literal('')),
  countryOfOrigin: z.string().optional().or(z.literal('')),
  trackLot: z.boolean().optional().default(false),
  trackSerial: z.boolean().optional().default(false),
  trackExpiry: z.boolean().optional().default(false),
  velocityClass: z.string().optional().or(z.literal('')),
})

type ProductFormValues = z.infer<typeof productSchema>

export function CreateProduct() {
  const navigate = useNavigate()
  const createMutation = useCreateProduct()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productCode: '',
      name: '',
      description: '',
      baseUomId: 'EA',
      categoryId: '',
      productType: '',
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      volume: undefined,
      unitWeight: undefined,
      storageRequirements: '',
      hazardousClass: '',
      storageConditions: '',
      imageUrl: '',
      manufacturer: '',
      countryOfOrigin: '',
      trackLot: false,
      trackSerial: false,
      trackExpiry: false,
      velocityClass: '',
    },
  })

  const onSubmit = useCallback(
    async (values: ProductFormValues) => {
      try {
        await createMutation.mutateAsync(values)
        toast.success('Product created successfully')
        navigate({ to: '/items/products' })
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || err?.message || 'Failed to create product'
        toast.error(msg)
      }
    },
    [createMutation, navigate],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/items/products' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground">
            Add a new product to the master catalog
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Enter the required information to create a new product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <CodeInput
                  control={form.control}
                  name="productCode"
                  label="Product Code"
                  placeholder="e.g. SKU-001"
                  description="Unique identifier for the product"
                  required
                />
                <NameInput
                  control={form.control}
                  name="name"
                  label="Product Name"
                  placeholder="e.g. Widget Alpha"
                  required
                />
                <UomSelect
                  control={form.control}
                  name="baseUomId"
                  label="Base Unit of Measure"
                  description="Primary unit for inventory tracking"
                  required
                />
                <VelocityClassSelect
                  control={form.control}
                  name="velocityClass"
                  label="Velocity Class"
                  description="ABC classification for putaway/pick prioritization"
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Category identifier" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional product category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FINISHED_GOOD">Finished Good</SelectItem>
                          <SelectItem value="RAW_MATERIAL">Raw Material</SelectItem>
                          <SelectItem value="WIP">Work In Progress</SelectItem>
                          <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                          <SelectItem value="PACKAGING">Packaging</SelectItem>
                          <SelectItem value="RETURNABLE">Returnable</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. US" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Weight</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volume</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.valueAsNumber || undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="storageRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Requirements</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Climate controlled" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hazardousClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hazardous Class</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Class 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storageConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Conditions</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 15-25°C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DescriptionTextarea
                control={form.control}
                name="description"
                label="Description"
                placeholder="Product description..."
              />

              <div>
                <FormLabel className="text-base">Tracking Options</FormLabel>
                <FormDescription className="mt-1 mb-4">
                  Configure how this product is tracked in the warehouse
                </FormDescription>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="trackLot"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Track Lots</FormLabel>
                          <FormDescription>
                            Assign lot numbers for traceability
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trackSerial"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Track Serial</FormLabel>
                          <FormDescription>
                            Unique serial numbers per unit
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trackExpiry"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Track Expiry</FormLabel>
                          <FormDescription>
                            Manage expiration dates (FEFO)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {createMutation.isPending ? 'Creating...' : 'Create Product'}
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: '/items/products' })}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
