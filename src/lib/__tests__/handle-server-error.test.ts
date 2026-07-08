import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/toast', () => ({
  showError: vi.fn(),
}))

import { handleServerError } from '@/lib/handle-server-error'
import { showError } from '@/lib/toast'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleServerError', () => {
  it('extracts message from response.data.detail (RFC 7807)', () => {
    handleServerError({
      response: {
        data: {
          type: 'https://example.com/errors/validation',
          title: 'Validation Error',
          status: 422,
          detail: 'The brand code already exists',
        },
      },
    })
    expect(showError).toHaveBeenCalledWith(
      'Validation Error: The brand code already exists',
    )
  })

  it('extracts message from response.data.message', () => {
    handleServerError({
      response: {
        data: {
          message: 'Network error occurred',
        },
      },
    })
    expect(showError).toHaveBeenCalledWith('Network error occurred')
  })

  it('extracts message from error.message when no response', () => {
    handleServerError(new Error('Something went wrong'))
    expect(showError).toHaveBeenCalledWith('Something went wrong')
  })

  it('uses fallback when no message is available', () => {
    handleServerError({})
    expect(showError).toHaveBeenCalledWith('An unexpected error occurred')
  })

  it('shows field-level validation errors', () => {
    handleServerError({
      response: {
        data: {
          title: 'Validation Error',
          detail: 'Invalid input',
          errors: {
            brand_code: ['Code is required', 'Code must be unique'],
            brand_name: ['Name is required'],
          },
        },
      },
    })
    expect(showError).toHaveBeenCalledWith('Validation Error: Invalid input')
    expect(showError).toHaveBeenCalledWith('brand_code: Code is required')
    expect(showError).toHaveBeenCalledWith('brand_code: Code must be unique')
    expect(showError).toHaveBeenCalledWith('brand_name: Name is required')
  })

  it('handles Axios error format', () => {
    handleServerError({
      response: {
        data: { message: 'Request failed with status code 404' },
        status: 404,
      },
      message: 'Request failed',
    })
    expect(showError).toHaveBeenCalledWith(
      'Request failed with status code 404',
    )
  })

  it('handles undefined error gracefully', () => {
    handleServerError(undefined)
    expect(showError).toHaveBeenCalledWith('An unexpected error occurred')
  })
})
