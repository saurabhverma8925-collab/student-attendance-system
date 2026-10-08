import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { REVIEW_DEADLINES, REVIEW_MARKS } from '@/lib/java-portal'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const totalTeams = await db.team.count()
  const finalizedTeams = await db.team.count({ where: { status: 'finalized' } })
  const formingTeams = await db.team.count({ where: { status: 'forming' } })
  const totalTopics = await db.presetTopic.count()
  const totalSubmissions = await db.reviewSubmission.count()
  const approvedR0 = await db.reviewSubmission.count({ where: { reviewNumber: 0, status: 'approved' } })
  const pendingR0 = await db.reviewSubmission.count({ where: { reviewNumber: 0, status: 'pending' } })
  const submittedR1 = await db.reviewSubmission.count({ where: { reviewNumber: 1 } })
  const approvedR1 = await db.reviewSubmission.count({ where: { reviewNumber: 1, status: 'approved' } })
  const submittedR2 = await db.reviewSubmission.count({ where: { reviewNumber: 2 } })
  const approvedR2 = await db.reviewSubmission.count({ where: { reviewNumber: 2, status: 'approved' } })
  const teams = await db.team.findMany({ include: { reviewSubmissions: true, members: { include: { student: { select: { name: true, studentId: true } } } } }, orderBy: { createdAt: 'asc' } })
  const leaderboard = teams.map((t) => {
    const r1 = t.reviewSubmissions.find((s) => s.reviewNumber === 1)
    const r2 = t.reviewSubmissions.find((s) => s.reviewNumber === 2)
    return { id: t.id, teamName: t.teamName, leader: t.members.find((m) => m.role === 'Leader')?.student.name || '—', memberCount: t.members.length, r1Marks: r1?.marksAwarded || 0, r2Marks: r2?.marksAwarded || 0, total: (r1?.marksAwarded || 0) + (r2?.marksAwarded || 0), maxTotal: REVIEW_MARKS.R1 + REVIEW_MARKS.R2, rubric: r1?.rubricType || r2?.rubricType || null }
  }).sort((a, b) => b.total - a.total)
  const now = new Date()
  const upcomingSessions = await db.liveSession.findMany({ where: { sessionDate: { gte: now } }, orderBy: { sessionDate: 'asc' }, take: 5 })
  return NextResponse.json({
    totalTeams, finalizedTeams, formingTeams, totalTopics, totalSubmissions,
    submissionByStatus: { r0: { approved: approvedR0, pending: pendingR0 }, r1: { submitted: submittedR1, approved: approvedR1 }, r2: { submitted: submittedR2, approved: approvedR2 } },
    leaderboard,
    upcomingSessions: upcomingSessions.map((s) => ({ id: s.id, title: s.title, sessionDate: s.sessionDate.toISOString(), dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
    deadlines: { r1_closes: REVIEW_DEADLINES.R1_CLOSES.toISOString(), r2_opens: REVIEW_DEADLINES.R2_OPENS.toISOString(), r2_closes: REVIEW_DEADLINES.R2_CLOSES.toISOString() },
    marks: REVIEW_MARKS,
  })
}
