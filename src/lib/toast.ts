import { toast } from 'sonner'

export const TOAST_DURATION = 5000

export function showSuccess(message: string) {
  toast.success(message, { duration: TOAST_DURATION })
}

export function showError(message: string) {
  toast.error(message, { duration: TOAST_DURATION })
}

export function showWarning(message: string) {
  toast.warning(message, { duration: TOAST_DURATION })
}

export function showInfo(message: string) {
  toast.info(message, { duration: TOAST_DURATION })
}
