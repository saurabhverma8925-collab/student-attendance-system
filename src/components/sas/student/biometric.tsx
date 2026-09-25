'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fingerprint,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ScanLine,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { simulateBiometricCapture } from '@/lib/client/fingerprint'
import { toast } from 'sonner'

type Stage = 'idle' | 'scanning' | 'enrolled'

export function StudentBiometric() {
  const { user, setUser } = useAppStore()
  const [stage, setStage] = useState<Stage>(user?.fingerprintEnrolled ? 'enrolled' : 'idle')
  const [scanCount, setScanCount] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const TOTAL_SCANS = 3

  useEffect(() => {
    setStage(user?.fingerprintEnrolled ? 'enrolled' : 'idle')
  }, [user?.fingerprintEnrolled])

  // Animated scan progress
  useEffect(() => {
    if (stage !== 'scanning') return
    setScanProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += 4
      setScanProgress(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(iv)
        completeScan()
      }
    }, 60)
    return () => clearInterval(iv)
  }, [stage, scanCount])

  async function startScan() {
    setStage('scanning')
    setScanProgress(0)
  }

  async function completeScan() {
    try {
      const { template } = await simulateBiometricCapture()
      await api('/api/auth/enroll-fingerprint', {
        method: 'POST',
        body: JSON.stringify({ template }),
      })
      const newCount = scanCount + 1
      setScanCount(newCount)
      if (newCount >= TOTAL_SCANS) {
        toast.success('Fingerprint enrolled successfully!')
        setStage('enrolled')
        setUser({ ...(user as any), fingerprintEnrolled: true })
      } else {
        toast.info(`Scan ${newCount} of ${TOTAL_SCANS} complete`)
        setStage('idle')
      }
    } catch (e: any) {
      toast.error(e.message)
      setStage('idle')
    }
  }

  async function reset() {
    setBusy(true)
    try {
      // Force reset by re-enrolling (in real life you'd call a reset endpoint)
      setStage('idle')
      setScanCount(0)
      setUser({ ...(user as any), fingerprintEnrolled: false })
      toast.info('Fingerprint reset. Please re-enroll.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Fingerprint className="w-6 h-6 text-primary" />
          Fingerprint Enrollment
        </h1>
        <p className="text-sm text-muted-foreground">
          Biometric authentication secures your attendance. Enroll 3 scans to complete setup.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Enrollment Status</span>
            {stage === 'enrolled' && (
              <Badge status="success"><CheckCircle2 className="w-4 h-4 mr-1" /> Enrolled</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Three scans required for template accuracy. Raw fingerprint never stored — only SHA-256 hash.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 py-6">
            {/* Fingerprint icon with scan animation */}
            <div className="relative">
              <motion.div
                animate={
                  stage === 'scanning'
                    ? { scale: [1, 1.05, 1] }
                    : { scale: 1 }
                }
                transition={{
                  duration: 0.8,
                  repeat: stage === 'scanning' ? Infinity : 0,
                }}
                className={`w-40 h-40 rounded-full flex items-center justify-center ${
                  stage === 'enrolled'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : stage === 'scanning'
                    ? 'bg-primary/10'
                    : 'bg-muted'
                }`}
              >
                {stage === 'scanning' ? (
                  <ScanLine className="w-20 h-20 text-primary" />
                ) : stage === 'enrolled' ? (
                  <CheckCircle2 className="w-20 h-20 text-emerald-600" />
                ) : (
                  <Fingerprint className="w-20 h-20 text-muted-foreground" />
                )}
              </motion.div>

              {stage === 'scanning' && (
                <motion.div
                  className="absolute inset-x-0 h-1 bg-primary/60 rounded-full"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {stage === 'scanning' && (
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="78"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeDasharray={`${(scanProgress / 100) * 490} 490`}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Scan progress */}
            <AnimatePresence mode="wait">
              {stage === 'idle' && (
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
                  <Button onClick={startScan} size="lg">
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Place finger to scan
                  </Button>
                </motion.div>
              )}

              {stage === 'scanning' && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-2"
                >
                  <div className="text-sm font-medium text-primary flex items-center gap-2 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning fingerprint…
                  </div>
                  <div className="text-xs text-muted-foreground">Keep finger on sensor</div>
                </motion.div>
              )}

              {stage === 'enrolled' && (
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
                  <Button variant="outline" onClick={reset} disabled={busy}>
                    Re-enroll fingerprint
                  </Button>
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
                      : i === scanCount && stage === 'scanning'
                      ? 'bg-primary animate-pulse'
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            How your fingerprint is protected
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 ml-6 list-disc">
            <li>Raw fingerprint image is never stored or transmitted.</li>
            <li>Server stores only a SHA-256 hash of the template — irreversible.</li>
            <li>Verification happens locally; only the hash is matched.</li>
            <li>You can re-enroll anytime; old templates are overwritten.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> This is a web simulation. In a production mobile app, this would use the platform&apos;s native BiometricPrompt (Android) or LAContext (iOS) for real fingerprint capture.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children, status }: { children: React.ReactNode; status?: 'success' }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-secondary'
    }`}>
      {children}
    </span>
  )
}
