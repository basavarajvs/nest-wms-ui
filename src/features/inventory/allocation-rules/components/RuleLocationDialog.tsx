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
import { LocationSelect } from '@/components/common/forms/LocationSelect'
import {
  ruleLocationSchema,
  type RuleLocationFormValues,
} from '../data/allocation-rule-schemas'
import { useAddRuleLocation } from '../data/allocation-rule-queries'

interface RuleLocationDialogProps {
  ruleId: string
  ruleName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RuleLocationDialog({ ruleId, ruleName, open, onOpenChange }: RuleLocationDialogProps) {
  const addRuleLocation = useAddRuleLocation()

  const form = useForm<RuleLocationFormValues>({
    resolver: zodResolver(ruleLocationSchema) as any,
    defaultValues: {
      locationId: '',
      priority: 0,
    },
  })

  const handleSubmit = async (values: RuleLocationFormValues) => {
    try {
      await addRuleLocation.mutateAsync({
        id: ruleId,
        dto: {
          locationId: values.locationId,
          priority: values.priority || 0,
        },
      })
      toast.success('Location override added successfully')
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add location override')
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
              <DialogTitle>Add Location Override</DialogTitle>
              <DialogDescription>
                Override the allocation destination for rule "{ruleName}"
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <LocationSelect
                control={form.control as any}
                name='locationId'
                label='Location *'
                placeholder='Select location'
              />
              <FormField
                control={form.control}
                name='priority'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        placeholder='0'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
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
              <Button type='submit' disabled={addRuleLocation.isPending}>
                {addRuleLocation.isPending ? 'Adding...' : 'Add Location'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
