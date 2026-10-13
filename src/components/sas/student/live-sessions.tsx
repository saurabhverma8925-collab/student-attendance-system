'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Calendar,
  Loader2,
  Clock,
  Video,
  ExternalLink,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

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

export function StudentLiveSessions() {
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

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

  const grouped = sessions.reduce<Record<string, LiveSession[]>>((acc, s) => {
    const k = dateKey(s.sessionDate)
    ;(acc[k] = acc[k] || []).push(s)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading live sessions…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Live Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming doubt-clearing sessions on Google Meet (Sundays &amp; Mondays).
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No upcoming live sessions scheduled.
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
                          <a
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Join Google Meet
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
