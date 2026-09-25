import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/qr-attendance/active?subjectId=...&date=...
// Returns the active QR session for a subject+date, plus live attendance count.
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }
  const url = new URL(req.url)
  const subjectId = url.searchParams.get('subjectId')
  const dateStr = url.searchParams.get('date')
  if (!subjectId || !dateStr) {
    return NextResponse.json({ error: 'subjectId and date are required' }, { status: 400 })
  }
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const qr = await db.qRSession.findFirst({
    where: { subjectId, date, isActive: true },
    include: {
      subject: { select: { code: true, name: true, branch: true, semester: true } },
      scans: {
        include: {
          student: { select: { studentId: true, name: true, section: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!qr) return NextResponse.json({ active: false })
  const now = new Date()
  const expired = qr.expiresAt < now
  return NextResponse.json({
    active: !expired,
    expired,
    token: qr.token,
    subject: qr.subject,
    date: qr.date.toISOString(),
    expiresAt: qr.expiresAt.toISOString(),
    createdAt: qr.createdAt.toISOString(),
    scans: qr.scans.map((s) => ({
      id: s.id,
      studentId: s.student.studentId,
      name: s.student.name,
      section: s.student.section,
      faceVerified: s.faceVerified,
      markedAt: s.createdAt.toISOString(),
    })),
    scanCount: qr.scans.length,
  })
}
