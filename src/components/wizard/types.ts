import type React from 'react'

export interface Step {
  id: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface StepperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  steps: Step[]
  currentStep: number | string
  onStepChange: (step: number | string) => void
  onComplete: () => void | Promise<void>
  onCancel?: () => void
  onBeforeNext?: (currentStep: number) => boolean | Promise<boolean>
  title?: string
  children: React.ReactNode
}
