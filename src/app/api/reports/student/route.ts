import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/reports/student?id=<studentId> OR (if student) returns own report
// Returns: subject-wise attendance of every subject for the student
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  let studentDbId: string

  if (session.role === 'student') {
    studentDbId = session.id
  } else {
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 })
    studentDbId = id
  }

  const student = await db.student.findUnique({
    where: { id: studentDbId },
    select: {
      id: true,
      studentId: true,
      name: true,
      branch: true,
      section: true,
      semester: true,
    },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Get all subjects for the student's branch+semester
  const subjects = await db.subject.findMany({
    where: { branch: student.branch, semester: student.semester },
    orderBy: { code: 'asc' },
  })

  const subjectsReport = await Promise.all(
    subjects.map(async (subj) => {
      const total = subj.totalClasses
      const present = await db.attendance.count({
        where: { studentId: studentDbId, subjectId: subj.id, status: 'Present' },
      })
      const absent = await db.attendance.count({
        where: { studentId: studentDbId, subjectId: subj.id, status: 'Absent' },
      })
      const percentage = total > 0 ? (present / total) * 100 : 0
      return {
        subjectId: subj.id,
        code: subj.code,
        name: subj.name,
        totalClasses: total,
        present,
        absent,
        percentage: Math.round(percentage * 100) / 100,
        lowAttendance: percentage < 75,
      }
    }),
  )

  // Overall attendance for the student
  const totalAtt = subjectsReport.reduce((sum, s) => sum + s.totalClasses, 0)
  const totalPresent = subjectsReport.reduce((sum, s) => sum + s.present, 0)
  const totalAbsent = subjectsReport.reduce((sum, s) => sum + s.absent, 0)
  const overallPct = totalAtt > 0 ? (totalPresent / totalAtt) * 100 : 0

  return NextResponse.json({
    student,
    subjects: subjectsReport,
    overall: {
      totalClasses: totalAtt,
      present: totalPresent,
      absent: totalAbsent,
      percentage: Math.round(overallPct * 100) / 100,
      lowAttendance: overallPct < 75,
    },
  })
}
