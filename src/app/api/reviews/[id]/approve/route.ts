import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const { id } = await ctx.params; const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json(); const status = sanitizeString(body?.status, 20); const feedback = sanitizeString(body?.feedback, 2000)
  if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 })
  const submission = await db.reviewSubmission.findUnique({ where: { id } })
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  const updated = await db.reviewSubmission.update({ where: { id }, data: { status, facultyFeedback: feedback || null, facultyReviewedAt: new Date(), reviewedBy: session.id } })
  return NextResponse.json({ ok: true, submission: updated })
}
