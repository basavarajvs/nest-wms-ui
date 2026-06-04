import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { RotateCcw, FlaskConical, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useRule,
  useEvaluateRule,
  useRollbackRule,
  type WmsRule,
  type WmsRuleVersion,
} from '../data/rule-queries'

interface RuleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ruleKey: string | null
}

export function RuleDetailDialog({ open, onOpenChange, ruleKey }: RuleDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('configuration')
  const [testData, setTestData] = useState('{\n  \n}')
  const [evaluateResult, setEvaluateResult] = useState<{
    passed: boolean
    message?: string
  } | null>(null)
  const [rollbackTarget, setRollbackTarget] = useState<WmsRuleVersion | null>(null)

  const { data: rule, isLoading, isError } = useRule(open ? ruleKey : null)
  const evaluateMutation = useEvaluateRule()
  const rollbackMutation = useRollbackRule()

  const formattedDefinition = useMemo(() => {
    if (!rule?.definitionJson) return ''
    try {
      return JSON.stringify(rule.definitionJson, null, 2)
    } catch {
      return String(rule.definitionJson)
    }
  }, [rule])

  const handleTest = async () => {
    if (!ruleKey) return

    let inputData: Record<string, unknown>
    try {
      inputData = JSON.parse(testData)
    } catch {
      toast.error('Invalid JSON in test data')
      return
    }

    try {
      const result = await evaluateMutation.mutateAsync({
        key: ruleKey,
        dto: { inputData },
      })
      const resultData = result as unknown as { passed?: boolean; message?: string }
      setEvaluateResult({
        passed: resultData?.passed ?? true,
        message: resultData?.message || (resultData?.passed !== false ? 'Rule evaluated successfully' : 'Rule evaluation failed'),
      })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Evaluation failed'
      setEvaluateResult({ passed: false, message: msg })
      toast.error(msg)
    }
  }

  const handleRollback = async () => {
    if (!ruleKey || !rollbackTarget) return

    try {
      await rollbackMutation.mutateAsync({
        key: ruleKey,
        version: String(rollbackTarget.version),
      })
      toast.success(`Rolled back to version ${rollbackTarget.version}`)
      setRollbackTarget(null)
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Rollback failed'
      toast.error(msg)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[700px] max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {isLoading ? 'Loading...' : rule?.name || rule?.ruleKey || 'Rule Details'}
            </DialogTitle>
            <DialogDescription>
              {rule?.ruleKey && `Key: ${rule.ruleKey}`}
              {rule?.ruleType && ` · Type: ${rule.ruleType}`}
              {rule?.version != null && ` · v${rule.version}`}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className='space-y-4 py-4'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          ) : isError || !rule ? (
            <div className='py-8 text-center text-muted-foreground'>
              Failed to load rule details.
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value='configuration'>Configuration</TabsTrigger>
                <TabsTrigger value='test'>Test</TabsTrigger>
                <TabsTrigger value='versions'>Versions</TabsTrigger>
              </TabsList>

              <TabsContent value='configuration' className='space-y-4 pt-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm text-muted-foreground'>Status</Label>
                    <div>
                      <Badge variant={rule.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {rule.status || 'UNKNOWN'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm text-muted-foreground'>Version</Label>
                    <div className='text-sm font-medium'>v{rule.version ?? 1}</div>
                  </div>
                  <div>
                    <Label className='text-sm text-muted-foreground'>Created</Label>
                    <div className='text-sm'>
                      {rule.createdAt
                        ? format(new Date(rule.createdAt), 'MMM d, yyyy HH:mm')
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm text-muted-foreground'>Last Evaluated</Label>
                    <div className='text-sm'>
                      {rule.lastEvaluatedAt
                        ? format(new Date(rule.lastEvaluatedAt), 'MMM d, yyyy HH:mm')
                        : 'Never'}
                    </div>
                  </div>
                </div>

                {rule.description && (
                  <div>
                    <Label className='text-sm text-muted-foreground'>Description</Label>
                    <p className='text-sm'>{rule.description}</p>
                  </div>
                )}

                <div>
                  <Label className='text-sm text-muted-foreground'>Rule Definition (JSON)</Label>
                  <pre className='mt-1 rounded-lg bg-muted p-4 text-sm overflow-x-auto'>
                    {formattedDefinition || 'No definition'}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value='test' className='space-y-4 pt-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='testData'>Test Input Data (JSON)</Label>
                  <Textarea
                    id='testData'
                    className='min-h-[160px] font-mono text-sm'
                    value={testData}
                    onChange={(e) => setTestData(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleTest}
                  disabled={evaluateMutation.isPending}
                >
                  {evaluateMutation.isPending ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <FlaskConical className='mr-2 h-4 w-4' />
                  )}
                  Test Rule
                </Button>

                {evaluateResult && (
                  <div
                    className={`rounded-lg border p-4 ${
                      evaluateResult.passed
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                    }`}
                  >
                    <div className='flex items-center gap-2 font-medium'>
                      {evaluateResult.passed ? (
                        <>
                          <CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
                          <span className='text-green-800 dark:text-green-300'>Passed</span>
                        </>
                      ) : (
                        <>
                          <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
                          <span className='text-red-800 dark:text-red-300'>Failed</span>
                        </>
                      )}
                    </div>
                    {evaluateResult.message && (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {evaluateResult.message}
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value='versions' className='space-y-4 pt-4'>
                {rule.version != null && (
                  <div className='space-y-3'>
                    {Array.from(
                      { length: Math.max(1, rule.version) },
                      (_, i) => rule.version! - i
                    ).map((v) => (
                      <div
                        key={v}
                        className='flex items-center justify-between rounded-lg border p-3'
                      >
                        <div>
                          <span className='font-medium'>v{v}</span>
                          {v === rule.version && (
                            <Badge variant='outline' className='ml-2'>
                              Current
                            </Badge>
                          )}
                        </div>
                        {v !== rule.version && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              setRollbackTarget({
                                version: v,
                                ruleKey: rule.ruleKey,
                              })
                            }
                          >
                            <RotateCcw className='mr-1 h-3 w-3' />
                            Rollback
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!rollbackTarget}
        onOpenChange={(open) => !open && setRollbackTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rollback Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback{' '}
              <span className='font-medium'>{rule?.ruleKey}</span> to version{' '}
              <span className='font-medium'>v{rollbackTarget?.version}</span>?
              This will overwrite the current rule configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRollbackTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              disabled={rollbackMutation.isPending}
            >
              {rollbackMutation.isPending ? 'Rolling back...' : 'Rollback'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
