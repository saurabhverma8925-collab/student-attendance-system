'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Calendar,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Video,
  ExternalLink,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LiveSession {
  id: string
  title: string
  description: string | null
  sessionDate: string
  dayOfWeek: string
  startTime: string
  endTime: string
  meetingUrl: string
  meetingType: string
}

const DAYS = ['Sunday', 'Monday'] as const

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function dateKey(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return iso
  }
}

export function LiveSessionsView() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  // form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState<string>('Sunday')
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('19:00')
  const [meetingUrl, setMeetingUrl] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await api<{ sessions: LiveSession[] }>('/api/live-sessions')
      setSessions(r.sessions)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createSession() {
    if (!title.trim()) return toast.error('Title is required')
    if (!sessionDate) return toast.error('Date is required')
    if (!dayOfWeek) return toast.error('Day of week is required')
    if (!startTime || !endTime) return toast.error('Start and end time are required')
    if (!meetingUrl.trim()) return toast.error('Meeting URL is required')
    setBusy('add')
    try {
      await api('/api/live-sessions', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          sessionDate,
          dayOfWeek,
          startTime,
          endTime,
          meetingUrl,
        }),
      })
      toast.success('Session scheduled')
      setAddOpen(false)
      setTitle('')
      setDescription('')
      setSessionDate('')
      setDayOfWeek('Sunday')
      setStartTime('18:00')
      setEndTime('19:00')
      setMeetingUrl('')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function deleteSession(s: LiveSession) {
    if (!confirm(`Delete session "${s.title}"?`)) return
    setBusy(`del:${s.id}`)
    try {
      await api(`/api/live-sessions/${s.id}`, { method: 'DELETE' })
      toast.success('Session deleted')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  // group sessions by date
  const grouped = sessions.reduce<Record<string, LiveSession[]>>((acc, s) => {
    const k = dateKey(s.sessionDate)
    ;(acc[k] = acc[k] || []).push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Schedule live doubt-clearing sessions on Sundays / Mondays.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Schedule a live session</DialogTitle>
              <DialogDescription>
                Sessions are visible to all students. Sunday &amp; Monday only.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ls-title">Title</Label>
                <Input
                  id="ls-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. R1 Doubt-Clearing Session"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ls-desc">Description</Label>
                <Textarea
                  id="ls-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What will be covered in this session?"
                  maxLength={1000}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ls-date">Session Date</Label>
                  <Input
                    id="ls-date"
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ls-start">Start Time</Label>
                  <Input
                    id="ls-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ls-end">End Time</Label>
                  <Input
                    id="ls-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ls-url">Meeting URL (Google Meet)</Label>
                <Input
                  id="ls-url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={busy === 'add'}>
                Cancel
              </Button>
              <Button onClick={createSession} disabled={busy === 'add'}>
                {busy === 'add' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No upcoming live sessions. Schedule one to begin.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, list]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium">{formatDate(date)}</h3>
                  <Badge variant="outline" className="text-[10px]">
                    {list.length} session{list.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {list.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-sm leading-snug">
                                {s.title}
                              </CardTitle>
                              <CardDescription className="text-xs flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {s.dayOfWeek}, {s.startTime}–{s.endTime}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[9px] shrink-0">
                              {s.meetingType || 'google_meet'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {s.description && (
                            <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                              {s.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 justify-between">
                            <a
                              href={s.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Join meeting
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive h-8"
                              onClick={() => deleteSession(s)}
                              disabled={busy === `del:${s.id}`}
                            >
                              {busy === `del:${s.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
