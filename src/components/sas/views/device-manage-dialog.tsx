'use client'

import { useEffect, useState } from 'react'
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Trash2,
  Plus,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

interface Student {
  id: string
  studentId: string
  name: string
  branch: string
  section: string
  semester: number
  deviceFingerprint: string | null
  deviceRegisteredAt: string | null
}

export function DeviceManageDialog({
  student,
  open,
  onOpenChange,
  onDone,
}: {
  student: Student | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [local, setLocal] = useState<Student | null>(student)

  useEffect(() => {
    setLocal(student)
  }, [student])

  // Sync local when student prop changes (e.g., after external update)
  useEffect(() => {
    if (student && (!local || local.id !== student.id)) {
      setLocal(student)
    }
  }, [student, local])

  if (!student) return null

  async function registerDevice() {
    if (!student) return
    if (
      student.deviceFingerprint &&
      !confirm(
        `A device is already registered for ${student.name}. Registering a new device will replace the existing binding. Continue?`,
      )
    )
      return
    setBusy(true)
    try {
      const r = await api(`/api/students/${student.id}/register-device`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      toast.success(`Device registered for ${student.name}`)
      setLocal((s) => (s ? { ...s, deviceFingerprint: r.deviceFingerprint, deviceRegisteredAt: r.registeredAt } : s))
      onDone()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function unbindDevice() {
    if (!student) return
    if (!confirm(`Unbind device from ${student.name} (${student.studentId})? They will need to re-register.`)) return
    setBusy(true)
    try {
      await api(`/api/students/${student.id}/unbind-device`, { method: 'POST' })
      toast.success(`Device unbound from ${student.name}`)
      setLocal((s) => (s ? { ...s, deviceFingerprint: null, deviceRegisteredAt: null } : s))
      onDone()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const deviceFp = local ? local.deviceFingerprint : student.deviceFingerprint
  const deviceAt = local ? local.deviceRegisteredAt : student.deviceRegisteredAt

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Manage Device
          </DialogTitle>
          <DialogDescription>
            Admin-only controls for <strong>{student.name}</strong> ({student.studentId}) • {student.branch} / Sec {student.section} / Sem {student.semester}
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Device Registration
              </span>
              {deviceFp ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Registered
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Not Registered
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              One device per student. Admin can override and replace the bound device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Device Fingerprint</div>
                <code className="text-[11px] font-mono break-all">
                  {deviceFp ? deviceFp.slice(0, 32) + '…' : '—'}
                </code>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Registered At</div>
                <div className="text-sm font-medium">
                  {deviceAt ? new Date(deviceAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={registerDevice} disabled={busy} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                {deviceFp ? 'Replace Device' : 'Register Device'}
              </Button>
              {deviceFp && (
                <Button onClick={unbindDevice} variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={busy}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Unbind Device
                </Button>
              )}
            </div>

            {deviceFp && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Replacing the device will invalidate attendance marking from the previous device. The student will need to use the newly registered device for all future attendance.
                </span>
              </div>
            )}

            {busy && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
