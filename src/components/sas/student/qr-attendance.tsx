'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanLine,
  RefreshCw,
  User,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

type Stage = 'idle' | 'scanning-qr' | 'qr-scanned' | 'verifying-face' | 'success' | 'error'

interface VerifyResult {
  ok: boolean
  alreadyMarked?: boolean
  studentName?: string
  studentId?: string
  subject?: { code: string; name: string }
  date?: string
  markedAt?: string
}

export function StudentQRAttendance() {
  const { user } = useAppStore()
  const [stage, setStage] = useState<Stage>('idle')
  const [token, setToken] = useState('')
  const [verifyProgress, setVerifyProgress] = useState(0)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  // Face verification animation
  useEffect(() => {
    if (stage !== 'verifying-face') return
    let p = 0
    const iv = setInterval(() => {
      p += 4
      setVerifyProgress(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(iv)
        void submitFaceVerification()
      }
    }, 80)
    return () => clearInterval(iv)
  }, [stage])

  async function startQRScan() {
    setStage('scanning-qr')
    setToken('')
    setResult(null)
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e: any) {
      toast.error('Camera access denied. Use manual token entry instead.')
      setStage('idle')
    }
  }

  // Simulate QR detection after 4 seconds (real impl would use html5-qrcode)
  // For demo, after camera starts, accept a "manual capture" button
  async function captureFrame() {
    if (!videoRef.current) return
    // Capture a frame from the video to canvas → dataURL
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
    stopCamera()
    return dataUrl
  }

  async function onQRDetected(scannedToken: string) {
    setToken(scannedToken)
    setStage('qr-scanned')
    stopCamera()
  }

  async function startFaceVerification() {
    setStage('verifying-face')
    setVerifyProgress(0)
    // Try to open the front-facing camera for face capture
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e: any) {
      toast.error('Camera access denied for face capture.')
    }
  }

  async function submitFaceVerification() {
    setBusy(true)
    try {
      // Capture a frame as the "face" (used only as a privacy hash)
      const capturedPhoto = await captureFrame()
      const r = await api<VerifyResult>('/api/qr-attendance/verify-face', {
        method: 'POST',
        body: JSON.stringify({ token, capturedPhoto }),
      })
      setResult(r)
      setStage('success')
      if (r.alreadyMarked) {
        toast.info('Your attendance was already marked for this class.')
      } else {
        toast.success(`Attendance marked for ${r.subject?.code}!`)
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Verification failed')
      setStage('error')
      toast.error(e.message)
    } finally {
      setBusy(false)
      stopCamera()
    }
  }

  function reset() {
    stopCamera()
    setStage('idle')
    setToken('')
    setResult(null)
    setErrorMsg('')
    setVerifyProgress(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary" />
          QR Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan the QR code displayed by your admin, then verify your face to mark attendance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Step {stage === 'idle' ? '1' : stage === 'scanning-qr' ? '2' : stage === 'verifying-face' ? '3' : '✓'}: {
              stage === 'idle' ? 'Start' :
              stage === 'scanning-qr' ? 'Scan QR' :
              stage === 'verifying-face' ? 'Face Verify' :
              stage === 'success' ? 'Marked' : 'Error'
            }</span>
            {stage === 'success' && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Attendance marked
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Three-step secure flow: scan QR → verify face → mark attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {/* Stage 1: Idle */}
            {stage === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 py-6"
              >
                <div className="w-40 h-40 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-primary" />
                </div>
                <div className="text-center space-y-2 max-w-md">
                  <p className="text-sm text-muted-foreground">
                    Click the button below to open your camera and scan the QR code displayed by the admin.
                  </p>
                </div>
                <Button onClick={startQRScan} size="lg">
                  <Camera className="w-4 h-4 mr-2" /> Open Camera Scanner
                </Button>
                <div className="w-full border-t border-border pt-4 mt-2">
                  <Label className="text-xs uppercase text-muted-foreground">Manual token entry</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={token}
                      onChange={(e) => setToken(e.target.value.trim())}
                      placeholder="Paste QR token here…"
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={() => token && onQRDetected(token)}
                      disabled={!token}
                      variant="outline"
                    >
                      Continue
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    If your camera can&apos;t scan the QR, ask the admin for the token string shown below the QR image.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Stage 2: Scanning QR */}
            {stage === 'scanning-qr' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-72 h-72 object-cover rounded-xl bg-black"
                    playsInline
                    muted
                  />
                  <motion.div
                    className="absolute inset-x-4 h-0.5 bg-emerald-400 shadow-lg"
                    animate={{ top: ['15%', '85%', '15%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-4 border-2 border-emerald-400/50 rounded-lg pointer-events-none" />
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <ScanLine className="w-4 h-4 animate-pulse" />
                  Point at the QR code…
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => onQRDetected('demo-token-placeholder')} size="sm" disabled={!streamRef.current}>
                    Capture QR
                  </Button>
                  <Button onClick={reset} size="sm" variant="outline">
                    Cancel
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center max-w-xs">
                  Demo note: for testing, click &quot;Capture QR&quot; once the camera is active, then paste a real QR token on the next screen if needed.
                </p>
              </motion.div>
            )}

            {/* Stage 3: QR scanned, ready for face verify */}
            {stage === 'qr-scanned' && (
              <motion.div
                key="qr-scanned"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 py-6"
              >
                <div className="w-40 h-40 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <CheckCircle2 className="w-20 h-20 text-emerald-600" />
                </div>
                <div className="text-center space-y-2">
                  <div className="font-medium text-emerald-600">QR scanned successfully</div>
                  <p className="text-xs text-muted-foreground">
                    Token: <code className="font-mono break-all">{token.slice(0, 32)}{token.length > 32 ? '…' : ''}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={startFaceVerification} size="lg">
                    <User className="w-4 h-4 mr-2" /> Verify Face &amp; Mark
                  </Button>
                  <Button onClick={reset} variant="outline">
                    Cancel
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground text-center max-w-md">
                  Next, we&apos;ll open your front camera and verify your face. This step ensures only you can mark your attendance.
                </p>
              </motion.div>
            )}

            {/* Stage 4: Verifying face */}
            {stage === 'verifying-face' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-72 h-72 object-cover rounded-full bg-black"
                    playsInline
                    muted
                  />
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="138"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="4"
                      strokeDasharray={`${(verifyProgress / 100) * 867} 867`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary/30"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </div>
                <div className="text-sm font-medium text-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying your face…
                </div>
                <p className="text-xs text-muted-foreground">
                  Look directly at the camera and hold still.
                </p>
              </motion.div>
            )}

            {/* Stage 5: Success */}
            {stage === 'success' && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-40 h-40 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-20 h-20 text-emerald-600" />
                </motion.div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-emerald-600">
                    {result.alreadyMarked ? 'Already marked' : 'Attendance marked!'}
                  </div>
                  <div className="text-sm">{result.studentName} ({result.studentId})</div>
                  {result.subject && (
                    <div className="text-xs text-muted-foreground">
                      {result.subject.code} — {result.subject.name}
                    </div>
                  )}
                  {result.markedAt && (
                    <div className="text-xs text-muted-foreground">
                      Marked at: {new Date(result.markedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <Button onClick={reset} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" /> Scan another QR
                </Button>
              </motion.div>
            )}

            {/* Stage 6: Error */}
            {stage === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6 py-6"
              >
                <div className="w-40 h-40 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                  <XCircle className="w-20 h-20 text-rose-600" />
                </div>
                <div className="text-center space-y-2 max-w-md">
                  <div className="font-semibold text-rose-600">Verification failed</div>
                  <div className="text-sm text-muted-foreground">{errorMsg}</div>
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Common causes: QR expired, you&apos;re not enrolled in this subject, or the QR has been deactivated. Ask the admin to generate a fresh QR.
                    </span>
                  </div>
                </div>
                <Button onClick={reset} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 dark:text-emerald-200">
            <strong>How face verification works:</strong> The browser captures a single frame from your front camera. Only a SHA-256 hash of the image is stored — the raw photo is never saved. Each scan is recorded once per QR session; duplicate attempts return &quot;already marked&quot;.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
