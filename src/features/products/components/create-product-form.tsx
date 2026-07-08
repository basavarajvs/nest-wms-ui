import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useBrands,
  useCategories,
  useUoms,
} from '@/features/products/data/lookup-queries'
import {
  createProductSchema,
  type CreateProductFormValues,
} from '@/features/products/schemas/product-schema'

interface CreateProductFormProps {
  onSubmit: (values: CreateProductFormValues) => void
  defaultValues?: Partial<CreateProductFormValues>
  isSubmitting?: boolean
  disabledFields?: string[]
}

const defaultFormValues: CreateProductFormValues = {
  product_code: '',
  product_name: '',
  description: '',
  brand_id: '',
  category_id: '',
  primary_uom_id: '',
  is_active: true,
}

export function CreateProductForm({
  onSubmit,
  defaultValues,
  isSubmitting,
  disabledFields,
}: CreateProductFormProps) {
  const disabledSet = new Set(disabledFields ?? [])
  const isDisabled = (name: string) => disabledSet.has(name) || !!isSubmitting
  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { ...defaultFormValues, ...defaultValues },
  })

  const brandsQuery = useBrands()
  const categoriesQuery = useCategories()
  const uomsQuery = useUoms()

  return (
    <Form {...form}>
      <form
        id="create-product-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="product_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. PROD-001" {...field} disabled={isDisabled('product_code')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} disabled={isDisabled('product_name')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Product description"
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={isDisabled('description')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="brand_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isDisabled('brand_id')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brandsQuery.isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : brandsQuery.data?.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No brands found
                      </SelectItem>
                    ) : (
                      brandsQuery.data?.map((brand) => (
                        <SelectItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isDisabled('category_id')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoriesQuery.isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : categoriesQuery.data?.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No categories found
                      </SelectItem>
                    ) : (
                      categoriesQuery.data?.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="primary_uom_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary UOM</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isDisabled('primary_uom_id')}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {uomsQuery.isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : uomsQuery.data?.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No UOMs found
                      </SelectItem>
                    ) : (
                      uomsQuery.data?.map((uom) => (
                        <SelectItem key={uom.value} value={uom.value}>
                          {uom.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-end gap-2 pb-1">
              <FormLabel className="pb-0">Active</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isDisabled('is_active')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
