'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LeaderboardRow {
  id: string
  teamName: string
  leader: string
  memberCount: number
  r1Marks: number
  r2Marks: number
  total: number
  maxTotal: number
  rubric: string | null
}

interface UpcomingSession {
  id: string
  title: string
  sessionDate: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface DashboardData {
  totalTeams: number
  finalizedTeams: number
  formingTeams: number
  totalTopics: number
  totalSubmissions: number
  submissionByStatus: {
    r0: { approved: number; pending: number }
    r1: { submitted: number; approved: number }
    r2: { submitted: number; approved: number }
  }
  leaderboard: LeaderboardRow[]
  upcomingSessions: UpcomingSession[]
  deadlines: { r1_closes: string; r2_opens: string; r2_closes: string }
  marks: { R0: number; R1: number; R2: number }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatTime(t: string): string {
  // expect HH:MM
  return t
}

export function JavaDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const r = await api<DashboardData>('/api/java-dashboard')
        if (!cancelled) setData(r)
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading dashboard…
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive text-sm">
          Failed to load dashboard: {error || 'unknown error'}
        </CardContent>
      </Card>
    )
  }

  const stats = [
    {
      label: 'Total Teams',
      value: data.totalTeams,
      sub: `${data.finalizedTeams} finalized · ${data.formingTeams} forming`,
      icon: Users,
    },
    {
      label: 'Preset Topics',
      value: data.totalTopics,
      sub: 'Across 7 categories',
      icon: BookOpen,
    },
    {
      label: 'Total Submissions',
      value: data.totalSubmissions,
      sub: `R0 pending: ${data.submissionByStatus.r0.pending}`,
      icon: FileText,
    },
    {
      label: 'Upcoming Live Sessions',
      value: data.upcomingSessions.length,
      sub: 'Next sessions scheduled',
      icon: Calendar,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Project Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Java Programming Project Submission Portal — overview, leaderboard and deadlines.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Submission by status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Progress</CardTitle>
          <CardDescription className="text-xs">
            Breakdown of submissions by review round.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Review 0</span>
              <Badge variant="secondary">0 marks</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Approved: {data.submissionByStatus.r0.approved} · Pending:{' '}
              {data.submissionByStatus.r0.pending}
            </div>
            <Progress
              value={
                data.submissionByStatus.r0.approved + data.submissionByStatus.r0.pending === 0
                  ? 0
                  : (data.submissionByStatus.r0.approved /
                      (data.submissionByStatus.r0.approved + data.submissionByStatus.r0.pending)) *
                    100
              }
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Review 1</span>
              <Badge variant="secondary">{data.marks.R1} marks</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Submitted: {data.submissionByStatus.r1.submitted} · Approved:{' '}
              {data.submissionByStatus.r1.approved}
            </div>
            <Progress
              value={
                data.submissionByStatus.r1.submitted === 0
                  ? 0
                  : (data.submissionByStatus.r1.approved / data.submissionByStatus.r1.submitted) *
                    100
              }
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Review 2</span>
              <Badge variant="secondary">{data.marks.R2} marks</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Submitted: {data.submissionByStatus.r2.submitted} · Approved:{' '}
              {data.submissionByStatus.r2.approved}
            </div>
            <Progress
              value={
                data.submissionByStatus.r2.submitted === 0
                  ? 0
                  : (data.submissionByStatus.r2.approved / data.submissionByStatus.r2.submitted) *
                    100
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Leaderboard</CardTitle>
            </div>
            <CardDescription className="text-xs">
              R1 + R2 marks. Max total {data.marks.R1 + data.marks.R2}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">R1</TableHead>
                    <TableHead className="text-right">R2</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                        No submissions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.leaderboard.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-medium">{row.teamName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {row.leader} · {row.memberCount} members
                            {row.rubric ? ` · Rubric ${row.rubric}` : ''}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.r1Marks}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.r2Marks}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {row.total}
                          <span className="text-muted-foreground font-normal">
                            /{row.maxTotal}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming sessions + deadlines */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Upcoming Live Sessions</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Next 5 scheduled sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcomingSessions.length === 0 ? (
                <div className="text-xs text-muted-foreground py-4">No upcoming sessions.</div>
              ) : (
                <ul className="space-y-3">
                  {data.upcomingSessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 rounded-md border border-border p-3"
                    >
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {s.dayOfWeek}, {formatDate(s.sessionDate)} · {formatTime(s.startTime)}–
                          {formatTime(s.endTime)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">R1 closes</span>
                <Badge variant="outline">{formatDate(data.deadlines.r1_closes)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">R2 opens</span>
                <Badge variant="outline">{formatDate(data.deadlines.r2_opens)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">R2 closes</span>
                <Badge variant="outline">{formatDate(data.deadlines.r2_closes)}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
