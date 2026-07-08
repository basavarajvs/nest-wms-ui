import { Fragment } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export interface DetailField {
  label: string
  value?: string | number | boolean | null
  render?: () => React.ReactNode
}

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  fields: DetailField[]
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  fields,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {fields.map((field) => (
              <Fragment key={field.label}>
                {field.render ? (
                  field.render()
                ) : (
                  <div className={field.label === 'Description' ? 'col-span-2' : ''}>
                    <span className="text-muted-foreground">{field.label}</span>
                    <div className="mt-1">
                      {field.value === null || field.value === undefined ? (
                        <span className="text-muted-foreground/50">-</span>
                      ) : typeof field.value === 'boolean' ? (
                        <Badge
                          className={
                            field.value
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : ''
                          }
                          variant={field.value ? 'outline' : 'secondary'}
                        >
                          {field.value ? 'Active' : 'Inactive'}
                        </Badge>
                      ) : (
                        <span className="font-medium">{String(field.value)}</span>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
