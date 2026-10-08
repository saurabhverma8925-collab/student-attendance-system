'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trophy,
  Award,
  Clock,
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
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  RUBRIC_A_R1,
  RUBRIC_B_R1,
  RUBRIC_A_R2,
  RUBRIC_B_R2,
  rubricTotal,
  type RubricCriterion,
} from '@/lib/java-portal'

interface TeamMember {
  id: string
  role: string
  student: { id: string; studentId: string; name: string; email: string }
}

interface ReviewSubmission {
  id: string
  reviewNumber: number
  status: string
  projectTitle: string | null
  projectDescription: string | null
  presentationUrl: string | null
  codeUrl: string | null
  reportUrl: string | null
  demoUrl: string | null
  rubricType: 'A' | 'B' | null
  marksAwarded: number | null
  facultyFeedback: string | null
  submittedAt: string | null
  teamId: string
}

interface Team {
  id: string
  teamName: string
  status: string
  members: TeamMember[]
  reviewSubmissions: ReviewSubmission[]
}

function statusBadge(status: string) {
  if (status === 'approved')
    return (
      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    )
  if (status === 'rejected')
    return (
      <Badge className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px]">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </Badge>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function getRubricFor(
  reviewNumber: number,
  rubricType: 'A' | 'B' | null,
): RubricCriterion[] {
  if (rubricType === null) return []
  if (reviewNumber === 1) return rubricType === 'A' ? RUBRIC_A_R1 : RUBRIC_B_R1
  if (reviewNumber === 2) return rubricType === 'A' ? RUBRIC_A_R2 : RUBRIC_B_R2
  return []
}

function getMaxFor(reviewNumber: number, rubricType: 'A' | 'B' | null): number {
  if (rubricType === null) return 0
  return rubricTotal(rubricType, reviewNumber as 1 | 2)
}

export function ReviewSubmissionsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'r0' | 'r1' | 'r2'>('r0')
  const [reviewing, setReviewing] = useState<ReviewSubmission | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  // R0 review state
  const [r0Feedback, setR0Feedback] = useState('')

  // R1/R2 marks state
  const [marksByCriterion, setMarksByCriterion] = useState<Record<string, number>>({})

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await api<{ teams: Team[] }>('/api/teams')
      setTeams(r.teams)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Flatten submissions per round
  const allSubs = useMemo(() => {
    const out: ReviewSubmission[] = []
    for (const t of teams) {
      for (const s of t.reviewSubmissions) {
        out.push({ ...s, teamId: t.id })
      }
    }
    return out.sort((a, b) => a.reviewNumber - b.reviewNumber)
  }, [teams])

  const r0 = allSubs.filter((s) => s.reviewNumber === 0)
  const r1 = allSubs.filter((s) => s.reviewNumber === 1)
  const r2 = allSubs.filter((s) => s.reviewNumber === 2)

  function teamNameFor(teamId: string) {
    return teams.find((t) => t.id === teamId)?.teamName || '—'
  }

  function openReview(s: ReviewSubmission) {
    setReviewing(s)
    setR0Feedback(s.facultyFeedback || '')
    const init: Record<string, number> = {}
    const rubric = getRubricFor(s.reviewNumber, s.rubricType)
    for (const c of rubric) init[c.name] = 0
    setMarksByCriterion(init)
  }

  async function approveR0(s: ReviewSubmission, status: 'approved' | 'rejected') {
    setBusy(`${s.id}:${status}`)
    try {
      await api(`/api/reviews/${s.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ status, feedback: r0Feedback }),
      })
      toast.success(`Review 0 ${status}`)
      setReviewing(null)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function awardMarks(s: ReviewSubmission) {
    if (!s.rubricType) return toast.error('Rubric type missing')
    const rubric = getRubricFor(s.reviewNumber, s.rubricType)
    const total = Object.values(marksByCriterion).reduce((a, b) => a + (b || 0), 0)
    const max = rubric.reduce((a, b) => a + b.maxMarks, 0)
    if (total > max) return toast.error(`Total ${total} exceeds max ${max}`)
    setBusy(`${s.id}:marks`)
    try {
      await api(`/api/reviews/${s.id}/marks`, {
        method: 'POST',
        body: JSON.stringify({ marksByCriterion, rubricType: s.rubricType }),
      })
      toast.success(`Marks awarded: ${total}/${max}`)
      setReviewing(null)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  function renderRow(s: ReviewSubmission) {
    return (
      <motion.div
        key={s.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">
                    {s.projectTitle || 'Untitled submission'}
                  </span>
                  {statusBadge(s.status)}
                  {s.rubricType && (
                    <Badge variant="outline" className="text-[10px]">
                      Rubric {s.rubricType}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Team: <span className="font-medium">{teamNameFor(s.teamId)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Submitted: {formatDate(s.submittedAt)}
                  {s.marksAwarded !== null && (
                    <span className="ml-2">
                      · Marks: <strong>{s.marksAwarded}</strong>
                      {s.rubricType && (
                        <span>/{getMaxFor(s.reviewNumber, s.rubricType)}</span>
                      )}
                    </span>
                  )}
                </div>
                {s.projectDescription && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {s.projectDescription}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {s.presentationUrl && (
                    <a
                      href={s.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Presentation
                    </a>
                  )}
                  {s.codeUrl && (
                    <a
                      href={s.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> GitHub
                    </a>
                  )}
                  {s.reportUrl && (
                    <a
                      href={s.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Report
                    </a>
                  )}
                  {s.demoUrl && (
                    <a
                      href={s.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Demo
                    </a>
                  )}
                </div>
                {s.facultyFeedback && (
                  <div className="mt-2 rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                    <strong>Faculty feedback:</strong>{' '}
                    {s.facultyFeedback.startsWith('{') ? (
                      <span>Marks awarded (see totals)</span>
                    ) : (
                      s.facultyFeedback
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 lg:items-end">
                {s.reviewNumber === 0 ? (
                  <Button size="sm" variant="default" onClick={() => openReview(s)}>
                    Review
                  </Button>
                ) : s.status === 'approved' ? (
                  <Badge variant="outline" className="text-[10px]">
                    <Award className="w-3 h-3 mr-1" />
                    {s.marksAwarded ?? 0}/{getMaxFor(s.reviewNumber, s.rubricType)}
                  </Badge>
                ) : (
                  <Button size="sm" variant="default" onClick={() => openReview(s)}>
                    Award Marks
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const reviewRubric =
    reviewing && reviewing.rubricType
      ? getRubricFor(reviewing.reviewNumber, reviewing.rubricType)
      : []

  const totalAwarded = Object.values(marksByCriterion).reduce(
    (a, b) => a + (b || 0),
    0,
  )

  const maxTotal = reviewing && reviewing.rubricType
    ? getMaxFor(reviewing.reviewNumber, reviewing.rubricType)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Approve Review 0 submissions and award marks for R1/R2 using the official rubric.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="r0">R0 ({r0.length})</TabsTrigger>
          <TabsTrigger value="r1">R1 ({r1.length})</TabsTrigger>
          <TabsTrigger value="r2">R2 ({r2.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="r0" className="mt-4 space-y-3">
          {loading ? (
            <Loading />
          ) : r0.length === 0 ? (
            <Empty label="No Review 0 submissions yet." />
          ) : (
            r0.map(renderRow)
          )}
        </TabsContent>
        <TabsContent value="r1" className="mt-4 space-y-3">
          {loading ? (
            <Loading />
          ) : r1.length === 0 ? (
            <Empty label="No Review 1 submissions yet." />
          ) : (
            r1.map(renderRow)
          )}
        </TabsContent>
        <TabsContent value="r2" className="mt-4 space-y-3">
          {loading ? (
            <Loading />
          ) : r2.length === 0 ? (
            <Empty label="No Review 2 submissions yet." />
          ) : (
            r2.map(renderRow)
          )}
        </TabsContent>
      </Tabs>

      {/* Review dialog */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Review {reviewing?.reviewNumber} — {reviewing?.projectTitle || 'Untitled'}
            </DialogTitle>
            <DialogDescription>
              Team: {reviewing && teamNameFor(reviewing.teamId)}
              {reviewing?.rubricType && ` · Rubric ${reviewing.rubricType}`}
            </DialogDescription>
          </DialogHeader>

          {reviewing?.projectDescription && (
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground max-h-40 overflow-y-auto">
              {reviewing.projectDescription}
            </div>
          )}

          {reviewing && (reviewing.presentationUrl || reviewing.codeUrl) && (
            <div className="flex flex-wrap gap-3 text-xs">
              {reviewing.presentationUrl && (
                <a
                  href={reviewing.presentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Presentation (PDF/PPT)
                </a>
              )}
              {reviewing.codeUrl && (
                <a
                  href={reviewing.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> GitHub Repository
                </a>
              )}
              {reviewing.reportUrl && (
                <a
                  href={reviewing.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Report
                </a>
              )}
              {reviewing.demoUrl && (
                <a
                  href={reviewing.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Demo Video
                </a>
              )}
            </div>
          )}

          {reviewing?.reviewNumber === 0 ? (
            <div className="space-y-2">
              <Label htmlFor="r0-feedback">Faculty Feedback (optional)</Label>
              <Textarea
                id="r0-feedback"
                value={r0Feedback}
                onChange={(e) => setR0Feedback(e.target.value)}
                rows={4}
                placeholder="Provide feedback to the team…"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  Rubric {reviewing?.rubricType} ({reviewing?.rubricType === 'A' ? 'GUI' : 'Web'}) — {maxTotal} marks total
                </span>
              </div>
              {reviewRubric.map((c) => (
                <div key={c.name} className="rounded-md border border-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs font-medium leading-snug">{c.name}</Label>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Max {c.maxMarks}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.description}</p>
                  <Input
                    type="number"
                    min={0}
                    max={c.maxMarks}
                    value={marksByCriterion[c.name] ?? 0}
                    onChange={(e) =>
                      setMarksByCriterion((cur) => ({
                        ...cur,
                        [c.name]: Number(e.target.value),
                      }))
                    }
                    className="h-8 w-24"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium">Total</span>
                <Badge
                  variant={totalAwarded > maxTotal ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {totalAwarded} / {maxTotal}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            {reviewing?.reviewNumber === 0 ? (
              <>
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => approveR0(reviewing, 'rejected')}
                  disabled={busy === `${reviewing.id}:rejected`}
                >
                  {busy === `${reviewing.id}:rejected` ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => approveR0(reviewing, 'approved')}
                  disabled={busy === `${reviewing.id}:approved`}
                >
                  {busy === `${reviewing.id}:approved` ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Approve
                </Button>
              </>
            ) : (
              <Button onClick={() => reviewing && awardMarks(reviewing)} disabled={!!busy}>
                {busy === `${reviewing?.id}:marks` && (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                )}
                Award Marks ({totalAwarded}/{maxTotal})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      Loading submissions…
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="p-10 text-center text-sm text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
        {label}
      </CardContent>
    </Card>
  )
}
