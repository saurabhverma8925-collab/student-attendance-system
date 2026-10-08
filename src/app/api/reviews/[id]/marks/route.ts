import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa } from '@/lib/security'
import { getRubric, rubricTotal } from '@/lib/java-portal'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const { id } = await ctx.params; const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json()
  const marksByCriterion: Record<string, number> = body?.marksByCriterion || {}
  const rubricType: 'A' | 'B' = body?.rubricType === 'A' ? 'A' : 'B'
  const submission = await db.reviewSubmission.findUnique({ where: { id } })
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (submission.reviewNumber === 0) return NextResponse.json({ error: 'Review 0 has no marks' }, { status: 400 })
  const rubric = getRubric(rubricType, submission.reviewNumber as 1 | 2)
  const maxTotal = rubricTotal(rubricType, submission.reviewNumber as 1 | 2)
  let totalAwarded = 0
  for (const criterion of rubric) {
    const awarded = Number(marksByCriterion[criterion.name] || 0)
    if (awarded < 0 || awarded > criterion.maxMarks || !Number.isFinite(awarded))
      return NextResponse.json({ error: `Invalid marks for "${criterion.name}" — must be 0 to ${criterion.maxMarks}` }, { status: 400 })
    totalAwarded += awarded
  }
  if (totalAwarded > maxTotal) return NextResponse.json({ error: `Total ${totalAwarded} exceeds max ${maxTotal}` }, { status: 400 })
  const updated = await db.reviewSubmission.update({ where: { id }, data: { marksAwarded: totalAwarded, rubricType, status: 'approved', facultyReviewedAt: new Date(), reviewedBy: session.id, facultyFeedback: JSON.stringify({ marksByCriterion, totalAwarded }) } })
  return NextResponse.json({ ok: true, submission: updated, totalAwarded, maxTotal })
}
