import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/attendance/daily?date=YYYY-MM-DD&subjectId=...
// Returns the attendance records for the given date (and optionally subject)
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const dateStr = url.searchParams.get('date')
  const subjectId = url.searchParams.get('subjectId')

  if (!dateStr) return NextResponse.json({ error: 'date is required' }, { status: 400 })
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

  const where: any = { date }
  if (subjectId) where.subjectId = subjectId

  const records = await db.attendance.findMany({
    where,
    include: {
      student: { select: { studentId: true, name: true, branch: true, section: true } },
      subject: { select: { code: true, name: true } },
    },
    orderBy: [{ subject: { code: 'asc' } }, { student: { studentId: 'asc' } }],
  })

  return NextResponse.json({ date: dateStr, records })
}
