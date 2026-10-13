import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/attendance/mark
// body: { subjectId, date (ISO), records: [{ studentId, status: 'Present'|'Absent' }] }
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { subjectId, date, records } = body as {
    subjectId: string
    date: string
    records: { studentId: string; status: 'Present' | 'Absent' }[]
  }
  if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'subjectId, date and records are required' }, { status: 400 })
  }

  const classDate = new Date(date)
  if (isNaN(classDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // Transaction: upsert attendance for every student, update subject.totalClasses
  await db.$transaction(async (tx) => {
    for (const r of records) {
      await tx.attendance.upsert({
        where: {
          studentId_subjectId_date: {
            studentId: r.studentId,
            subjectId,
            date: classDate,
          },
        },
        create: {
          studentId: r.studentId,
          subjectId,
          date: classDate,
          status: r.status,
          markedBy: session.id,
          markedVia: 'manual',
        },
        update: {
          status: r.status,
          markedBy: session.id,
          markedVia: 'manual',
        },
      })
    }

    // Recalculate subject.totalClasses = distinct dates attendance recorded for this subject
    const distinctDates = await tx.attendance.findMany({
      where: { subjectId },
      select: { date: true },
      distinct: ['date'],
    })
    await tx.subject.update({
      where: { id: subjectId },
      data: { totalClasses: distinctDates.length },
    })
  })

  return NextResponse.json({ ok: true, marked: records.length })
}
