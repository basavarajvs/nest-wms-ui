import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/features/products/types/product'

interface ViewProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
}

export function ViewProductDialog({
  open,
  onOpenChange,
  product,
}: ViewProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product.product_name}</DialogTitle>
          <DialogDescription>Code: {product.product_code}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Category</span>
              <p className="mt-1 font-medium">{product.category_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">UOM</span>
              <p className="mt-1 font-medium">{product.uom_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Brand</span>
              <p className="mt-1 font-medium">{product.brand_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <div className="mt-1">
                <Badge
                  className={
                    product.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : ''
                  }
                  variant={product.is_active ? 'outline' : 'secondary'}
                >
                  {product.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          {product.description && (
            <div className="text-sm">
              <span className="text-muted-foreground">Description</span>
              <p className="mt-1">{product.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
