import { showError } from '@/lib/toast'

interface ServerError {
  response?: {
    data?: {
      type?: string
      title?: string
      status?: number
      detail?: string
      instance?: string
      message?: string
      errors?: Record<string, string[]>
    }
    status?: number
  }
  message?: string
}

export function handleServerError(error: unknown): void {
  const serverError = error as ServerError
  const data = serverError?.response?.data

  const title = data?.title || ''
  const detail = data?.detail || data?.message || serverError?.message || ''
  const fallback = 'An unexpected error occurred'

  const message = [title, detail].filter(Boolean).join(': ') || fallback

  showError(message)

  const errors = data?.errors
  if (errors) {
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach((msg) => showError(`${field}: ${msg}`))
    })
  }
}
