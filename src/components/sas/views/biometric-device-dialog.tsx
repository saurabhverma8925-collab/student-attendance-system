'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fingerprint,
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanLine,
  ShieldCheck,
  RefreshCw,
  Smartphone as DeviceIcon,
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
  fingerprintEnrolled: boolean
  deviceFingerprint: string | null
  deviceRegisteredAt: string | null
}

type Stage = 'idle' | 'scanning' | 'enrolled'

export function BiometricDeviceDialog({
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
  const [fpStage, setFpStage] = useState<Stage>('idle')
  const [scanCount, setScanCount] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [local, setLocal] = useState<Student | null>(student)

  useEffect(() => {
    setLocal(student)
    setFpStage(student?.fingerprintEnrolled ? 'enrolled' : 'idle')
    setScanCount(0)
    setScanProgress(0)
  }, [student])

  // Sync local when student prop changes (e.g., after external update)
  useEffect(() => {
    if (student && (!local || local.id !== student.id)) {
      setLocal(student)
    }
  }, [student, local])

  // Animated scan progress
  useEffect(() => {
    if (fpStage !== 'scanning') return
    setScanProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += 5
      setScanProgress(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(iv)
        void completeScan()
      }
    }, 50)
    return () => clearInterval(iv)
  }, [fpStage, scanCount, student?.id])

  if (!student) return null

  const TOTAL_SCANS = 3

  async function completeScan() {
    if (!student) return
    setBusy(true)
    try {
      await api(`/api/students/${student.id}/enroll-fingerprint`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const newCount = scanCount + 1
      setScanCount(newCount)
      if (newCount >= TOTAL_SCANS) {
        toast.success(`Fingerprint enrolled for ${student.name}`)
        setFpStage('enrolled')
        setLocal((s) => (s ? { ...s, fingerprintEnrolled: true } : s))
        onDone()
      } else {
        toast.info(`Scan ${newCount} of ${TOTAL_SCANS} complete`)
        setFpStage('idle')
      }
    } catch (e: any) {
      toast.error(e.message)
      setFpStage('idle')
    } finally {
      setBusy(false)
    }
  }

  function startScan() {
    setFpStage('scanning')
    setScanProgress(0)
  }

  async function resetBiometric() {
    if (!student) return
    if (!confirm(`Reset fingerprint for ${student.name} (${student.studentId})?`)) return
    setBusy(true)
    try {
      await api(`/api/students/${student.id}/reset-biometric`, { method: 'POST' })
      toast.success(`Fingerprint reset for ${student.name}`)
      setFpStage('idle')
      setScanCount(0)
      setLocal((s) => (s ? { ...s, fingerprintEnrolled: false } : s))
      onDone()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

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

  const enrolled = local ? local.fingerprintEnrolled : student.fingerprintEnrolled
  const deviceFp = local ? local.deviceFingerprint : student.deviceFingerprint
  const deviceAt = local ? local.deviceRegisteredAt : student.deviceRegisteredAt

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Manage Biometric &amp; Device
          </DialogTitle>
          <DialogDescription>
            Admin-only controls for <strong>{student.name}</strong> ({student.studentId}) • {student.branch} / Sec {student.section} / Sem {student.semester}
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Biometric section */}
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-primary" />
                  Fingerprint Enrollment
                </span>
                {enrolled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Enrolled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Not Enrolled
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Run a 3-scan enrollment flow on behalf of the student. Only SHA-256 hash stored.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative">
                  <motion.div
                    animate={fpStage === 'scanning' ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.8, repeat: fpStage === 'scanning' ? Infinity : 0 }}
                    className={`w-32 h-32 rounded-full flex items-center justify-center ${
                      fpStage === 'enrolled' || enrolled
                        ? 'bg-emerald-50 dark:bg-emerald-950/30'
                        : fpStage === 'scanning'
                        ? 'bg-primary/10'
                        : 'bg-muted'
                    }`}
                  >
                    {fpStage === 'scanning' ? (
                      <ScanLine className="w-16 h-16 text-primary" />
                    ) : fpStage === 'enrolled' || enrolled ? (
                      <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                    ) : (
                      <Fingerprint className="w-16 h-16 text-muted-foreground" />
                    )}
                  </motion.div>

                  {fpStage === 'scanning' && (
                    <motion.div
                      className="absolute inset-x-0 h-1 bg-primary/60 rounded-full"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {fpStage === 'scanning' && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="60"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        strokeDasharray={`${(scanProgress / 100) * 377} 377`}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {fpStage === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-3"
                    >
                      <div className="text-sm text-muted-foreground">
                        Scan {scanCount + 1} of {TOTAL_SCANS}
                      </div>
                      <Button onClick={startScan} disabled={busy}>
                        <Fingerprint className="w-4 h-4 mr-2" />
                        {enrolled ? 'Re-enroll Fingerprint' : 'Start Enrollment'}
                      </Button>
                    </motion.div>
                  )}

                  {fpStage === 'scanning' && (
                    <motion.div
                      key="scanning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-1"
                    >
                      <div className="text-sm font-medium text-primary flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" /> Scanning fingerprint…
                      </div>
                      <div className="text-xs text-muted-foreground">Keep finger on sensor</div>
                    </motion.div>
                  )}

                  {fpStage === 'enrolled' && (
                    <motion.div
                      key="enrolled"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center space-y-3"
                    >
                      <div className="text-sm text-emerald-600 font-medium">
                        ✓ Fingerprint enrolled successfully
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step indicators */}
                <div className="flex gap-2">
                  {Array.from({ length: TOTAL_SCANS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${
                        i < scanCount
                          ? 'bg-emerald-600'
                          : i === scanCount && fpStage === 'scanning'
                          ? 'bg-primary animate-pulse'
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                {enrolled && (
                  <Button variant="outline" size="sm" onClick={resetBiometric} disabled={busy}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Reset Fingerprint
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device section */}
          <Card className="sm:col-span-2">
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
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
