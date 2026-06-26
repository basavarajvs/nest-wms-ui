import { useState, useCallback } from 'react'
import {
  Package,
  Plus,
  Play,
  StopCircle,
  Trash2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  useCloseSession,
  type PackingSession,
} from './data/packing-queries'
import { SESSION_STATUS_BADGE } from './data/packing-schemas'
import { StartSessionDialog } from './components/StartSessionDialog'
import { ScanItemDialog } from './components/ScanItemDialog'
import { SessionContainersPanel } from './components/SessionContainersPanel'
import { SessionHistoryPanel } from './components/SessionHistoryPanel'

export function PackingDashboard() {
  const [sessions, setSessions] = useState<PackingSession[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [closeConfirmId, setCloseConfirmId] = useState<string | null>(null)

  const closeSession = useCloseSession()

  const handleSessionCreated = useCallback((res: unknown) => {
    const sessionData = (res as any)?.data || res || {}
    const newSession: PackingSession = {
      id: sessionData.id || sessionData.sessionId || crypto.randomUUID(),
      stationCode: sessionData.stationCode || '',
      status: sessionData.status || 'active',
      createdAt: sessionData.createdAt || new Date().toISOString(),
      startedAt: sessionData.startedAt || sessionData.createdAt || new Date().toISOString(),
    }
    setSessions((prev) => [newSession, ...prev])
    setSelectedSessionId(newSession.id)
  }, [])

  const handleCloseSession = async () => {
    if (!closeConfirmId) return
    try {
      await closeSession.mutateAsync(closeConfirmId)
      toast.success('Session closed')
      setSessions((prev) =>
        prev.map((s) =>
          s.id === closeConfirmId ? { ...s, status: 'closed' } : s
        )
      )
      if (selectedSessionId === closeConfirmId) {
        setSelectedSessionId(null)
      }
      setCloseConfirmId(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to close session')
    }
  }

  const handleRemoveSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (selectedSessionId === id) setSelectedSessionId(null)
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)

  const activeSessions = sessions.filter((s) => s.status === 'active' || s.status === 'open')
  const closedSessions = sessions.filter((s) => s.status === 'closed' || s.status === 'cancelled')

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Packing Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage packing sessions, scan items, and seal containers
          </p>
        </div>
        <Button onClick={() => setStartDialogOpen(true)}>
          <Play className='mr-2 h-4 w-4' />
          Start Packing
        </Button>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{activeSessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Closed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{closedSessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{sessions.length}</p>
          </CardContent>
        </Card>
      </div>

      {sessions.length > 0 && (
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle>
              Sessions {sessions.length ? `(${sessions.length})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className='w-[180px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className={`cursor-pointer ${
                        selectedSessionId === session.id ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => setSelectedSessionId(session.id)}
                    >
                      <TableCell className='font-medium'>
                        {session.stationCode || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SESSION_STATUS_BADGE[session.status || ''] || 'secondary'}>
                          {session.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground'>
                        {session.startedAt
                          ? new Date(session.startedAt).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-1' onClick={(e) => e.stopPropagation()}>
                          {(session.status === 'active' || session.status === 'open') && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => setCloseConfirmId(session.id)}
                            >
                              <StopCircle className='mr-1 h-3 w-3' />
                              Close
                            </Button>
                          )}
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleRemoveSession(session.id)}
                          >
                            <Trash2 className='h-4 w-4 text-muted-foreground' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center text-muted-foreground'>
                        No sessions yet. Click "Start Packing" to begin.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSession && selectedSessionId && (
        <div className='space-y-6'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center justify-between text-base'>
                <span className='flex items-center gap-2'>
                  <Package className='h-4 w-4' />
                  Session — {selectedSession.stationCode || selectedSession.id.substring(0, 12)}
                </span>
                {(selectedSession.status === 'active' || selectedSession.status === 'open') && (
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => setCloseConfirmId(selectedSession.id)}
                    disabled={closeSession.isPending}
                  >
                    <StopCircle className='mr-2 h-4 w-4' />
                    Close Session
                  </Button>
                )}
              </CardTitle>
              <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                <Badge variant={SESSION_STATUS_BADGE[selectedSession.status || ''] || 'secondary'}>
                  {selectedSession.status || 'unknown'}
                </Badge>
                {selectedSession.startedAt && (
                  <span className='flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    Started {new Date(selectedSession.startedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </CardHeader>
          </Card>

          <SessionContainersPanel
            sessionId={selectedSessionId}
            onScanItem={() => setScanDialogOpen(true)}
          />

          <SessionHistoryPanel sessionId={selectedSessionId} />

          <ScanItemDialog
            sessionId={selectedSessionId}
            open={scanDialogOpen}
            onOpenChange={setScanDialogOpen}
          />
        </div>
      )}

      {sessions.length === 0 && !selectedSession && (
        <div className='flex flex-col items-center gap-3 py-16 text-center'>
          <Package className='h-16 w-16 text-muted-foreground/20' />
          <p className='text-lg font-medium text-muted-foreground'>
            No packing sessions
          </p>
          <p className='text-sm text-muted-foreground'>
            Start a packing session to begin scanning items and filling containers
          </p>
          <Button onClick={() => setStartDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Start Packing
          </Button>
        </div>
      )}

      <StartSessionDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onSessionCreated={handleSessionCreated}
      />

      <AlertDialog
        open={!!closeConfirmId}
        onOpenChange={(open) => { if (!open) setCloseConfirmId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Packing Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this packing session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseSession}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Close Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
