import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

import { showSuccess, showError, showWarning, showInfo, TOAST_DURATION } from '@/lib/toast'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('showSuccess', () => {
  it('calls toast.success with the message and default duration', () => {
    showSuccess('Operation completed')
    expect(toast.success).toHaveBeenCalledWith('Operation completed', {
      duration: TOAST_DURATION,
    })
  })
})

describe('showError', () => {
  it('calls toast.error with the message and default duration', () => {
    showError('Something failed')
    expect(toast.error).toHaveBeenCalledWith('Something failed', {
      duration: TOAST_DURATION,
    })
  })
})

describe('showWarning', () => {
  it('calls toast.warning with the message and default duration', () => {
    showWarning('Proceed with caution')
    expect(toast.warning).toHaveBeenCalledWith('Proceed with caution', {
      duration: TOAST_DURATION,
    })
  })
})

describe('showInfo', () => {
  it('calls toast.info with the message and default duration', () => {
    showInfo('Here is some information')
    expect(toast.info).toHaveBeenCalledWith('Here is some information', {
      duration: TOAST_DURATION,
    })
  })
})
