import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/reports/low-attendance
// Returns: all students whose overall attendance is below 75%
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const students = await db.student.findMany({
    select: {
      id: true,
      studentId: true,
      name: true,
      branch: true,
      section: true,
      semester: true,
      email: true,
      phone: true,
    },
    orderBy: { studentId: 'asc' },
  })

  const result: any[] = []
  for (const s of students) {
    const total = await db.attendance.count({ where: { studentId: s.id } })
    if (total === 0) continue
    const present = await db.attendance.count({ where: { studentId: s.id, status: 'Present' } })
    const pct = (present / total) * 100
    if (pct < 75) {
      // Subject-wise breakdown of low subjects
      const subjects = await db.subject.findMany({
        where: { branch: s.branch, semester: s.semester },
      })
      const subjectBreakdown: any[] = []
      for (const subj of subjects) {
        const subjTotal = await db.attendance.count({
          where: { studentId: s.id, subjectId: subj.id },
        })
        if (subjTotal === 0) continue
        const subjPresent = await db.attendance.count({
          where: { studentId: s.id, subjectId: subj.id, status: 'Present' },
        })
        const subjPct = (subjPresent / subjTotal) * 100
        if (subjPct < 75) {
          subjectBreakdown.push({
            code: subj.code,
            name: subj.name,
            present: subjPresent,
            total: subjTotal,
            percentage: Math.round(subjPct * 100) / 100,
          })
        }
      }
      result.push({
        ...s,
        present,
        total,
        percentage: Math.round(pct * 100) / 100,
        lowSubjects: subjectBreakdown,
      })
    }
  }

  result.sort((a, b) => a.percentage - b.percentage)

  return NextResponse.json({ students: result, count: result.length })
}
