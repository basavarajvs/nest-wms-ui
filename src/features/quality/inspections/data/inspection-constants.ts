export const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PASSED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CONDITIONAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const RESULT_BADGE: Record<string, string> = {
  PASS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  FAIL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'N/A': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export type InspectionAction = 'Start' | 'Edit' | 'Record Result' | 'Complete (Pass)' | 'Complete (Fail)' | 'Reopen'

export const INSPECTION_ACTIONS: Record<string, InspectionAction[]> = {
  PENDING: ['Start', 'Edit'],
  IN_PROGRESS: ['Record Result', 'Complete (Pass)', 'Complete (Fail)'],
  PASSED: ['Reopen'],
  FAILED: ['Reopen'],
  CONDITIONAL: ['Reopen'],
}
