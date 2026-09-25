import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/reports/subject?id=<subjectId>
// Returns: class attendance summary - per-student present/absent/percentage for a subject
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const subjectId = url.searchParams.get('id')
  if (!subjectId) return NextResponse.json({ error: 'id query param required' }, { status: 400 })

  const subject = await db.subject.findUnique({ where: { id: subjectId } })
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  // Get all students enrolled in this subject's branch+semester
  const students = await db.student.findMany({
    where: { branch: subject.branch, semester: subject.semester },
    orderBy: { studentId: 'asc' },
    select: {
      id: true,
      studentId: true,
      name: true,
      section: true,
    },
  })

  const totalClasses = subject.totalClasses
  const report = await Promise.all(
    students.map(async (stu) => {
      const present = await db.attendance.count({
        where: { studentId: stu.id, subjectId: subject.id, status: 'Present' },
      })
      const absent = await db.attendance.count({
        where: { studentId: stu.id, subjectId: subject.id, status: 'Absent' },
      })
      const pct = totalClasses > 0 ? (present / totalClasses) * 100 : 0
      return {
        id: stu.id,
        studentId: stu.studentId,
        name: stu.name,
        section: stu.section,
        present,
        absent,
        percentage: Math.round(pct * 100) / 100,
        lowAttendance: pct < 75,
      }
    }),
  )

  const totalPresent = report.reduce((s, r) => s + r.present, 0)
  const totalAbsent = report.reduce((s, r) => s + r.absent, 0)
  const totalAtt = totalPresent + totalAbsent
  const overallPct = totalAtt > 0 ? (totalPresent / totalAtt) * 100 : 0

  return NextResponse.json({
    subject: {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      branch: subject.branch,
      semester: subject.semester,
      totalClasses,
    },
    students: report,
    overall: {
      totalRecords: totalAtt,
      present: totalPresent,
      absent: totalAbsent,
      percentage: Math.round(overallPct * 100) / 100,
    },
  })
}
