import { toast } from 'sonner'

interface ServerError {
  response?: {
    data?: {
      message?: string
      detail?: string
      title?: string
      errors?: Record<string, string[]>
    }
    status?: number
  }
  message?: string
}

export function handleServerError(error: unknown): void {
  const serverError = error as ServerError
  const message =
    serverError?.response?.data?.message ||
    serverError?.response?.data?.detail ||
    serverError?.response?.data?.title ||
    serverError?.message ||
    'An unexpected error occurred'

  toast.error(message)

  const errors = serverError?.response?.data?.errors
  if (errors) {
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach((msg) => {
        toast.error(`${field}: ${msg}`)
      })
    })
  }
}
