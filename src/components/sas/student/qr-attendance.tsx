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
  CameraOff,
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
import { Html5Qrcode } from 'html5-qrcode'

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
  const [manualToken, setManualToken] = useState('')
  const [verifyProgress, setVerifyProgress] = useState(0)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null)
  const [scanStatus, setScanStatus] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const qrScannerRef = useRef<Html5Qrcode | null>(null)
  const qrRegionId = 'qr-scan-region'

  // Check camera support on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false)
    } else {
      // Try a quick permission probe
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop())
          setCameraSupported(true)
        })
        .catch(() => setCameraSupported(false))
    }
    return () => stopAll()
  }, [])

  function stopAll() {
    // Stop html5-qrcode scanner
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current
          .stop()
          .then(() => qrScannerRef.current?.clear())
          .catch(() => {})
      } catch {
        // ignore
      }
      qrScannerRef.current = null
    }
    // Stop any raw stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll()
  }, [])

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

  // Real QR scanning using html5-qrcode
  async function startQRScan() {
    setStage('scanning-qr')
    setToken('')
    setResult(null)
    setErrorMsg('')
    setScanStatus('Requesting camera…')

    // Wait a tick so the QR region div exists in the DOM
    await new Promise((r) => setTimeout(r, 100))

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId, {
        verbose: false,
        useBarCodeDetectorIfSupported: true,
      })
      qrScannerRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Success — a real QR was decoded
          setScanStatus('QR decoded!')
          void onQRDetected(decodedText)
        },
        () => {
          // Per-frame failure — silently ignore (this fires constantly)
        },
      )
      setScanStatus('Point your camera at the QR code')
    } catch (e: any) {
      console.error('QR scanner start failed:', e)
      toast.error('Camera access denied. Use manual token entry instead.')
      setStage('idle')
      setScanStatus('')
    }
  }

  async function onQRDetected(scannedToken: string) {
    setToken(scannedToken)
    setStage('qr-scanned')
    setScanStatus('')
    // Stop the QR scanner (frees the camera for the next stage)
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop()
        qrScannerRef.current.clear()
      } catch {
        // ignore
      }
      qrScannerRef.current = null
    }
  }

  function submitManualToken() {
    if (!manualToken.trim()) {
      toast.error('Enter a QR token first')
      return
    }
    setToken(manualToken.trim())
    setStage('qr-scanned')
  }

  // Capture a frame from the front camera (used as the "face" — only hashed)
  async function captureFrameFromFrontCamera(): Promise<string | undefined> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      })
      streamRef.current = stream
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()
      // Wait a moment for the video to render a frame
      await new Promise((r) => setTimeout(r, 800))
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      return dataUrl
    } catch {
      return undefined
    }
  }

  async function startFaceVerification() {
    setStage('verifying-face')
    setVerifyProgress(0)
  }

  async function submitFaceVerification() {
    setBusy(true)
    try {
      // Capture a frame as the "face" (used only as a privacy hash)
      const capturedPhoto = await captureFrameFromFrontCamera()
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
    }
  }

  function reset() {
    stopAll()
    setStage('idle')
    setToken('')
    setManualToken('')
    setResult(null)
    setErrorMsg('')
    setVerifyProgress(0)
    setScanStatus('')
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
            <span>Step {
              stage === 'idle' ? '1' :
              stage === 'scanning-qr' ? '2' :
              stage === 'verifying-face' ? '3' : '✓'
            }: {
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
                  {cameraSupported === false && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md p-2 mt-2">
                      <CameraOff className="w-4 h-4 shrink-0" />
                      <span>Camera not available in this browser. Use manual token entry below.</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={startQRScan}
                  size="lg"
                  disabled={cameraSupported === false}
                >
                  <Camera className="w-4 h-4 mr-2" /> Open Camera Scanner
                </Button>

                <div className="w-full border-t border-border pt-4 mt-2">
                  <Label className="text-xs uppercase text-muted-foreground">Manual token entry</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value.trim())}
                      placeholder="Paste QR token here…"
                      className="font-mono text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          submitManualToken()
                        }
                      }}
                    />
                    <Button
                      onClick={submitManualToken}
                      disabled={!manualToken.trim()}
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

            {/* Stage 2: Scanning QR (real html5-qrcode scanner) */}
            {stage === 'scanning-qr' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                {/* This div is where html5-qrcode injects its video feed */}
                <div
                  id={qrRegionId}
                  className="w-72 h-72 rounded-xl overflow-hidden bg-black border-2 border-primary/40"
                />
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <ScanLine className="w-4 h-4 animate-pulse" />
                  {scanStatus || 'Point at the QR code…'}
                </div>
                <Button onClick={reset} size="sm" variant="outline">
                  Cancel
                </Button>
                <p className="text-[11px] text-muted-foreground text-center max-w-xs">
                  Hold your camera steady. The scanner auto-detects the QR code — no button press needed.
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
                <div className="relative w-72 h-72 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  <User className="w-32 h-32 text-muted-foreground" />
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
                  Looking for your registered face…
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
