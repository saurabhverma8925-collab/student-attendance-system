'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  ExternalLink,
  Send,
  Trophy,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
}

interface Team {
  id: string
  teamName: string
  status: string
  members: TeamMember[]
  reviewSubmissions: ReviewSubmission[]
}

function statusBadge(status?: string) {
  if (!status) return <Badge variant="outline" className="text-[10px]">Not submitted</Badge>
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

function getRubricFor(
  reviewNumber: number,
  rubricType: 'A' | 'B' | null,
): RubricCriterion[] {
  if (rubricType === null) return []
  if (reviewNumber === 1) return rubricType === 'A' ? RUBRIC_A_R1 : RUBRIC_B_R1
  if (reviewNumber === 2) return rubricType === 'A' ? RUBRIC_A_R2 : RUBRIC_B_R2
  return []
}

export function MyReviewsView() {
  const [team, setTeam] = useState<Team | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  // form state
  const [reviewNumber, setReviewNumber] = useState<number>(0)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [proposedTopic, setProposedTopic] = useState(false)
  const [rubricType, setRubricType] = useState<'A' | 'B'>('A')
  const [presentationUrl, setPresentationUrl] = useState('')
  const [codeUrl, setCodeUrl] = useState('')
  const [reportUrl, setReportUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await api<{ team: Team | null; role: string | null }>('/api/teams')
      setTeam(r.team)
      setRole(r.role)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openSubmit(n: number) {
    if (!team) return
    setReviewNumber(n)
    setProjectTitle('')
    setProjectDescription('')
    setProposedTopic(false)
    setRubricType('A')
    setPresentationUrl('')
    setCodeUrl('')
    setReportUrl('')
    setDemoUrl('')
    setSubmitting(n)
  }

  async function submitReview() {
    if (!team) return
    if (!projectTitle.trim()) return toast.error('Project title is required')
    if (reviewNumber === 0 && !projectDescription.trim())
      return toast.error('Project description is required')
    if (reviewNumber === 1 || reviewNumber === 2) {
      if (!presentationUrl.trim())
        return toast.error('Presentation File URL (PDF/PPT) is required')
      if (!codeUrl.trim()) return toast.error('GitHub Repository URL is required')
    }
    setBusy(true)
    try {
      await api('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          teamId: team.id,
          reviewNumber,
          projectTitle,
          projectDescription,
          proposedTopic,
          presentationUrl,
          codeUrl,
          reportUrl,
          demoUrl,
          rubricType: reviewNumber === 0 ? null : rubricType,
        }),
      })
      toast.success(`Review ${reviewNumber} submitted`)
      setSubmitting(null)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const r0 = team?.reviewSubmissions.find((s) => s.reviewNumber === 0)
  const r1 = team?.reviewSubmissions.find((s) => s.reviewNumber === 1)
  const r2 = team?.reviewSubmissions.find((s) => s.reviewNumber === 2)

  const r0Approved = !!r0 && r0.status === 'approved'
  const r1Submitted = !!r1
  const r2Open = true // simplified; backend enforces actual date gates

  const previewRubric = useMemo<RubricCriterion[]>(() => {
    if (reviewNumber === 0) return []
    return getRubricFor(reviewNumber, rubricType)
  }, [reviewNumber, rubricType])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading reviews…
      </div>
    )
  }

  if (!team) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
          You must join or create a team before submitting reviews.
        </CardContent>
      </Card>
    )
  }

  if (team.status === 'forming') {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground space-y-2">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
          <div className="font-medium text-foreground">Team not finalized</div>
          <p>
            Your team must be finalized by your leader before you can submit any review.
            Current status: <Badge variant="outline" className="text-[10px] capitalize">{team.status}</Badge>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Three progressive reviews: R0 (project proposal) → R1 (rubric-based, 33 marks) → R2 (final, 17 marks).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* R0 */}
        <ReviewCard
          n={0}
          label="Review 0 — Project Proposal"
          marks="0 marks"
          submission={r0}
          canSubmit
          onSubmit={() => openSubmit(0)}
        />
        {/* R1 */}
        <ReviewCard
          n={1}
          label="Review 1 — Progress"
          marks="33 marks"
          submission={r1}
          canSubmit={r0Approved}
          locked={!r0Approved}
          lockedReason="Review 0 must be approved by faculty first"
          onSubmit={() => openSubmit(1)}
        />
        {/* R2 */}
        <ReviewCard
          n={2}
          label="Review 2 — Final"
          marks="17 marks"
          submission={r2}
          locked={!r1Submitted}
          lockedReason="Submit Review 1 first"
          onSubmit={() => openSubmit(2)}
        />
      </div>

      {/* Submit Dialog */}
      <Dialog open={submitting !== null} onOpenChange={(o) => !o && setSubmitting(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submit Review {reviewNumber}
            </DialogTitle>
            <DialogDescription>
              {reviewNumber === 0
                ? 'Submit your project proposal (title + description). Faculty will approve or ask you to revise.'
                : 'Submit your progress with presentation file, GitHub repo, and rubric type. Marks awarded per rubric.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Common: project title */}
            <div className="space-y-1.5">
              <Label htmlFor="pt">Project Title <span className="text-destructive">*</span></Label>
              <Input
                id="pt"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Library Management System"
                maxLength={200}
              />
            </div>

            {reviewNumber === 0 ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="pd">
                    Project Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="pd"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={5}
                    placeholder="Briefly describe the project scope, key features, technologies (Java, JDBC, Swing, Servlets, etc.) and how it will satisfy the rubric."
                    maxLength={2000}
                  />
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-3">
                  <Switch
                    checked={proposedTopic}
                    onCheckedChange={setProposedTopic}
                    id="prop"
                  />
                  <Label htmlFor="prop" className="text-xs">
                    This is a <strong>custom-proposed topic</strong> (not from the preset list).
                  </Label>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Project Description</Label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    placeholder="Optional — describe what has changed since the last review."
                    maxLength={2000}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Rubric Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={rubricType}
                    onValueChange={(v) => setRubricType(v as 'A' | 'B')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rubric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Rubric A — GUI-based Project</SelectItem>
                      <SelectItem value="B">Rubric B — Web-based Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pres">
                    Presentation File URL (PDF/PPT) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pres"
                    value={presentationUrl}
                    onChange={(e) => setPresentationUrl(e.target.value)}
                    placeholder="https://drive.google.com/.../presentation.pdf"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Upload your presentation to Google Drive / Dropbox and paste the shareable link.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gh">
                    GitHub Repository URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gh"
                    value={codeUrl}
                    onChange={(e) => setCodeUrl(e.target.value)}
                    placeholder="https://github.com/your-team/your-project"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Make sure the repository is public so faculty can review the source code.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rep">Report URL (optional)</Label>
                    <Input
                      id="rep"
                      value={reportUrl}
                      onChange={(e) => setReportUrl(e.target.value)}
                      placeholder="https://drive.google.com/.../report.pdf"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dem">Demo Video URL (optional)</Label>
                    <Input
                      id="dem"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                      placeholder="https://youtube.com/.../demo"
                    />
                  </div>
                </div>

                {/* Rubric preview */}
                <div className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      Rubric {rubricType} ({rubricType === 'A' ? 'GUI' : 'Web'}) Preview
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Max {rubricTotal(rubricType, reviewNumber as 1 | 2)} marks
                    </Badge>
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-1.5">
                    {previewRubric.map((c) => (
                      <li key={c.name} className="flex items-start gap-2">
                        <Trophy className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                        <div>
                          <span className="text-foreground font-medium">{c.name}</span>{' '}
                          <span className="text-[10px]">({c.maxMarks} marks)</span>
                          <div className="text-[10px]">{c.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubmitting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={busy}>
              {busy ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Submit Review {reviewNumber}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ReviewCardProps {
  n: number
  label: string
  marks: string
  submission?: ReviewSubmission
  canSubmit?: boolean
  locked?: boolean
  lockedReason?: string
  onSubmit: () => void
}

function ReviewCard({ n, label, marks, submission, canSubmit, locked, lockedReason, onSubmit }: ReviewCardProps) {
  const maxMarks = n === 1 ? 33 : n === 2 ? 17 : 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.05 }}
    >
      <Card className={locked ? 'opacity-70' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-primary" />}
                Review {n}
              </CardTitle>
              <CardDescription className="text-xs">{label}</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">{marks}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {locked ? (
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{lockedReason}</span>
            </div>
          ) : (
            <>
              {submission ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status</span>
                    {statusBadge(submission.status)}
                  </div>
                  {submission.projectTitle && (
                    <div className="text-sm font-medium line-clamp-2">
                      {submission.projectTitle}
                    </div>
                  )}
                  {submission.rubricType && (
                    <Badge variant="outline" className="text-[10px]">
                      Rubric {submission.rubricType}
                    </Badge>
                  )}
                  {submission.marksAwarded !== null && (
                    <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                      Marks awarded: <strong>{submission.marksAwarded}</strong> / {maxMarks}
                    </div>
                  )}
                  {submission.presentationUrl && (
                    <a
                      href={submission.presentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Presentation
                    </a>
                  )}
                  {submission.codeUrl && (
                    <a
                      href={submission.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline ml-2"
                    >
                      <ExternalLink className="w-3 h-3" /> GitHub
                    </a>
                  )}
                  {submission.facultyFeedback && !submission.facultyFeedback.startsWith('{') && (
                    <div className="rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      <strong>Faculty feedback:</strong> {submission.facultyFeedback}
                    </div>
                  )}
                  {submission.status === 'rejected' && (
                    <Button size="sm" variant="default" className="w-full" onClick={onSubmit}>
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Resubmit
                    </Button>
                  )}
                </div>
              ) : (
                canSubmit && (
                  <Button size="sm" variant="default" className="w-full" onClick={onSubmit}>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Submit Review {n}
                  </Button>
                )
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
