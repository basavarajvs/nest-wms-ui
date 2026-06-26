import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  constraintSchema,
  CONSTRAINT_FIELD_OPTIONS,
  CONSTRAINT_OPERATOR_OPTIONS,
  type ConstraintFormValues,
} from '../data/allocation-rule-schemas'
import { useAddConstraint } from '../data/allocation-rule-queries'

interface ConstraintDialogProps {
  ruleId: string
  ruleName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConstraintDialog({ ruleId, ruleName, open, onOpenChange }: ConstraintDialogProps) {
  const addConstraint = useAddConstraint()

  const form = useForm<ConstraintFormValues>({
    resolver: zodResolver(constraintSchema) as any,
    defaultValues: {
      constraintField: '',
      constraintOperator: '',
      constraintValue: '',
    },
  })

  const handleSubmit = async (values: ConstraintFormValues) => {
    try {
      await addConstraint.mutateAsync({
        id: ruleId,
        dto: {
          constraintField: values.constraintField,
          constraintOperator: values.constraintOperator,
          constraintValue: values.constraintValue,
        },
      })
      toast.success('Constraint added successfully')
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add constraint')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        form.reset()
        onOpenChange(false)
      }
    }}>
      <DialogContent className='sm:max-w-[480px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Constraint</DialogTitle>
              <DialogDescription>
                Add a constraint to rule "{ruleName}"
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='constraintField'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select field' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONSTRAINT_FIELD_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='constraintOperator'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select operator' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONSTRAINT_OPERATOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='constraintValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. product-123 or perishable,household' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={addConstraint.isPending}>
                {addConstraint.isPending ? 'Adding...' : 'Add Constraint'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
