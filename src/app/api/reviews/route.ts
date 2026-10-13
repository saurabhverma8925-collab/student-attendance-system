import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'
import { canSubmitReview } from '@/lib/java-portal'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url); const teamId = url.searchParams.get('teamId')
  if (session.role === 'student') {
    if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    const membership = await db.teamMember.findUnique({ where: { teamId_studentId: { teamId, studentId: session.id } } })
    if (!membership) return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 })
  }
  const where: any = teamId ? { teamId } : {}
  const submissions = await db.reviewSubmission.findMany({ where, include: { team: { select: { teamName: true, id: true } } }, orderBy: { reviewNumber: 'asc' } })
  const status = {
    hasR0: submissions.some((s) => s.reviewNumber === 0),
    r0Approved: submissions.some((s) => s.reviewNumber === 0 && s.status === 'approved'),
    hasR1: submissions.some((s) => s.reviewNumber === 1),
    hasR2: submissions.some((s) => s.reviewNumber === 2),
  }
  const now = new Date()
  return NextResponse.json({
    submissions,
    status,
    canSubmit: {
      r0: canSubmitReview(0, status, now),
      r1: canSubmitReview(1, status, now),
      r2: canSubmitReview(2, status, now),
    },
  })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Student access required' }, { status: 401 })
  const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json()
  const teamId = sanitizeString(body?.teamId, 50)
  const reviewNumber = Number(body?.reviewNumber)
  if (![0, 1, 2].includes(reviewNumber)) return NextResponse.json({ error: 'reviewNumber must be 0, 1, or 2' }, { status: 400 })
  if (!teamId) return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  const membership = await db.teamMember.findUnique({
    where: { teamId_studentId: { teamId, studentId: session.id } },
    include: { team: { include: { members: true, reviewSubmissions: true } } },
  })
  if (!membership) return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 })
  const subs = membership.team.reviewSubmissions
  const status = {
    hasR0: subs.some((s) => s.reviewNumber === 0),
    r0Approved: subs.some((s) => s.reviewNumber === 0 && s.status === 'approved'),
    hasR1: subs.some((s) => s.reviewNumber === 1),
    hasR2: subs.some((s) => s.reviewNumber === 2),
  }
  const gate = canSubmitReview(reviewNumber as 0 | 1 | 2, status)
  if (!gate.allowed) return NextResponse.json({ error: gate.reason || 'Cannot submit' }, { status: 400 })
  const existing = subs.find((s) => s.reviewNumber === reviewNumber)
  if (existing && existing.status === 'approved') return NextResponse.json({ error: 'Already approved — cannot resubmit' }, { status: 400 })

  // Per guidelines: R1/R2 require presentationUrl + codeUrl (GitHub) + rubricType
  const projectTitle = sanitizeString(body?.projectTitle, 200)
  const projectDescription = sanitizeString(body?.projectDescription, 2000)
  const presentationUrl = sanitizeString(body?.presentationUrl, 500) // PDF/PPT link
  const reportUrl = sanitizeString(body?.reportUrl, 500)
  const codeUrl = sanitizeString(body?.codeUrl, 500) // GitHub repo URL
  const demoUrl = sanitizeString(body?.demoUrl, 500)
  const rubricType = body?.rubricType === 'A' || body?.rubricType === 'B' ? body.rubricType : null
  const proposedTopic = !!body?.proposedTopic

  if (reviewNumber === 0) {
    if (!projectTitle || !projectDescription) return NextResponse.json({ error: 'Project title and description are required for Review 0' }, { status: 400 })
  }
  if (reviewNumber === 1 || reviewNumber === 2) {
    // Per guidelines: must submit presentation file + GitHub link
    if (!presentationUrl) return NextResponse.json({ error: 'Presentation file URL (PDF/PPT) is required' }, { status: 400 })
    if (!codeUrl) return NextResponse.json({ error: 'GitHub repository URL is required' }, { status: 400 })
    if (!rubricType) return NextResponse.json({ error: 'Rubric type (A for GUI or B for Web) is required' }, { status: 400 })
  }

  const submission = await db.reviewSubmission.upsert({
    where: { teamId_reviewNumber: { teamId, reviewNumber } },
    create: { teamId, reviewNumber, projectTitle, projectDescription, proposedTopic, presentationUrl, reportUrl, codeUrl, demoUrl, rubricType, status: 'pending', submittedAt: new Date() },
    update: { projectTitle, projectDescription, proposedTopic, presentationUrl, reportUrl, codeUrl, demoUrl, rubricType, status: 'pending', submittedAt: new Date(), facultyReviewedAt: null, reviewedBy: null, marksAwarded: null, facultyFeedback: null },
  })
  await audit({ actorId: session.id, actorRole: 'student', action: `review.${reviewNumber}.submitted`, target: teamId, ip, userAgent: ua, details: { submissionId: submission.id, projectTitle, hasPresentation: !!presentationUrl, hasGitHub: !!codeUrl, rubricType } })
  return NextResponse.json({ ok: true, submission })
}
