'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Users,
  XCircle,
  Camera,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Subject {
  id: string
  code: string
  name: string
  branch: string
  semester: number
}

interface QRSession {
  active: boolean
  expired?: boolean
  token?: string
  qrDataUrl?: string
  subject?: { code: string; name: string }
  date?: string
  expiresAt?: string
  createdAt?: string
  scans?: { id: string; studentId: string; name: string; section: string; faceVerified: boolean; markedAt: string }[]
  scanCount?: number
}

export function QRAttendanceView() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<string>('')
  // Use the user's local date (not UTC) so the input shows today correctly
  const [date, setDate] = useState<string>(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
  const [duration, setDuration] = useState<number>(10)
  const [busy, setBusy] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [qr, setQr] = useState<QRSession | null>(null)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api<{ subjects: Subject[] }>('/api/subjects').then((r) => {
      setSubjects(r.subjects)
      if (r.subjects[0]) setSubjectId(r.subjects[0].id)
    })
  }, [])

  // Poll for live scan count when QR is active
  useEffect(() => {
    if (qr?.active && subjectId && date) {
      pollRef.current = setInterval(async () => {
        try {
          const r = await api<QRSession>(`/api/qr-attendance/active?subjectId=${subjectId}&date=${date}`)
          setQr(r)
        } catch (e: any) {
          // silent
        }
      }, 3000)
      return () => {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }
  }, [qr?.active, subjectId, date])

  async function generateQR() {
    if (!subjectId) {
      toast.error('Select a subject first')
      return
    }
    setGenerating(true)
    try {
      const r = await api<QRSession>('/api/qr-attendance/generate', {
        method: 'POST',
        body: JSON.stringify({ subjectId, date, durationMinutes: duration }),
      })
      setQr(r)
      toast.success(`QR generated. Expires in ${duration} minutes.`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function refreshActive() {
    if (!subjectId || !date) return
    setLoading(true)
    try {
      const r = await api<QRSession>(`/api/qr-attendance/active?subjectId=${subjectId}&date=${date}`)
      setQr(r)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedSubject = subjects.find((s) => s.id === subjectId)
  const now = new Date()
  const expiresAt = qr?.expiresAt ? new Date(qr.expiresAt) : null
  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode className="w-6 h-6 text-primary" />
          QR Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Generate a QR code for a class. Students scan it via their portal and verify their face to mark attendance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate QR Code</CardTitle>
          <CardDescription>Select subject + date + validity window. The QR refreshes live with attendance counts.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <Label>Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.branch} / Sem {s.semester})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Valid (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <Button onClick={generateQR} disabled={generating || !subjectId} size="lg">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
            Generate QR
          </Button>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>QR Code</span>
              {qr?.active && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse mr-1" />
                  Live
                </Badge>
              )}
              {qr?.expired && (
                <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {qr?.subject ? `${qr.subject.code} — ${qr.subject.name}` : 'No QR generated yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            {qr?.qrDataUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-white rounded-xl shadow-md"
              >
                <img src={qr.qrDataUrl} alt="QR code" className="w-72 h-72" />
              </motion.div>
            ) : (
              <div className="w-72 h-72 rounded-xl bg-muted/40 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground/40" />
              </div>
            )}

            {qr?.active && expiresAt && (
              <div className="text-center space-y-1">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Clock className="w-4 h-4" />
                  Expires in <strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</strong>
                </div>
                <code className="text-[10px] font-mono text-muted-foreground break-all max-w-xs block">
                  Token: {qr.token}
                </code>
              </div>
            )}

            <Button variant="outline" onClick={refreshActive} disabled={loading || !subjectId}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Refresh live status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Live Attendance
              </span>
              {qr?.scanCount !== undefined && (
                <Badge variant="secondary">{qr.scanCount} marked</Badge>
              )}
            </CardTitle>
            <CardDescription>Students who scanned + face-verified.</CardDescription>
          </CardHeader>
          <CardContent>
            {!qr?.scans || qr.scans.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No students have marked attendance yet.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                <AnimatePresence>
                  {qr.scans.map((s) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-emerald-50/40 dark:bg-emerald-950/10"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {s.studentId} • Sec {s.section} • {new Date(s.markedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        <Camera className="w-3 h-3 mr-1" /> Face ✓
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
