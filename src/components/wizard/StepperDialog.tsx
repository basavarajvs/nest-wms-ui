import { useCallback, useMemo, useState } from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { StepperDialogProps } from './types'

function getStepStatus(index: number, currentStepIndex: number) {
  if (index < currentStepIndex) return 'completed'
  if (index === currentStepIndex) return 'current'
  return 'pending'
}

export function StepperDialog({
  open,
  onOpenChange,
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  onBeforeNext,
  title,
  children,
}: StepperDialogProps) {
  const [loading, setLoading] = useState(false)

  const currentStepIndex = useMemo(() => {
    if (typeof currentStep === 'string') {
      const idx = steps.findIndex((s) => s.id === currentStep)
      return idx >= 0 ? idx : 0
    }
    return currentStep
  }, [currentStep, steps])

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handleNext = useCallback(async () => {
    if (onBeforeNext) {
      const canProceed = await onBeforeNext(currentStepIndex)
      if (!canProceed) return
    }
    if (isLastStep) {
      setLoading(true)
      try {
        await onComplete()
      } finally {
        setLoading(false)
      }
    } else {
      onStepChange(currentStepIndex + 1)
    }
  }, [currentStepIndex, isLastStep, onBeforeNext, onComplete, onStepChange])

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1)
    }
  }, [isFirstStep, currentStepIndex, onStepChange])

  const handleCancel = useCallback(() => {
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[640px]' showCloseButton={false}>
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {steps[currentStepIndex]?.description && (
            <DialogDescription>
              {steps[currentStepIndex].description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className='py-4'>
          <nav aria-label='Progress'>
            <ol className='flex items-center'>
              {steps.map((step, index) => {
                const status = getStepStatus(index, currentStepIndex)
                const StepIcon = step.icon
                return (
                  <li
                    key={step.id}
                    className={cn(
                      'flex items-center',
                      index < steps.length - 1 && 'flex-1'
                    )}
                  >
                    <div className='flex items-center'>
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                          status === 'completed' &&
                            'bg-primary text-primary-foreground',
                          status === 'current' &&
                            'border-2 border-primary bg-background text-primary',
                          status === 'pending' &&
                            'border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                        )}
                      >
                        {status === 'completed' ? (
                          <CheckIcon className='size-4' />
                        ) : StepIcon ? (
                          <StepIcon className='size-4' />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className='ml-2 hidden text-sm sm:block'>
                        <span
                          className={cn(
                            'font-medium',
                            status === 'completed' && 'text-primary',
                            status === 'current' && 'text-foreground',
                            status === 'pending' && 'text-muted-foreground'
                          )}
                        >
                          {step.title}
                        </span>
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'mx-2 h-px flex-1',
                          index < currentStepIndex
                            ? 'bg-primary'
                            : 'bg-muted-foreground/30'
                        )}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        <div className='min-h-[200px]'>{children}</div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <div className='flex gap-2'>
            {!isFirstStep && (
              <Button
                type='button'
                variant='outline'
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              type='button'
              onClick={handleNext}
              disabled={loading}
            >
              {loading
                ? 'Submitting...'
                : isLastStep
                  ? 'Submit'
                  : 'Next'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
