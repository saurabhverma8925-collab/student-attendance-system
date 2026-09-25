import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/dashboard/stats
// Returns: totalStudents, totalSubjects, todayClasses, overallSummary { total, present, absent, percentage }
//         + per-branch counts, lowAttendanceCount
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const totalStudents = await db.student.count()
  const totalSubjects = await db.subject.count()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Today's classes = distinct subjects that have attendance recorded today
  const todayClasses = await db.attendance.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    select: { subjectId: true },
    distinct: ['subjectId'],
  })

  // Overall summary
  const totalRecords = await db.attendance.count()
  const presentCount = await db.attendance.count({ where: { status: 'Present' } })
  const absentCount = await db.attendance.count({ where: { status: 'Absent' } })
  const overallPercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

  // Per-branch counts
  const branchesRaw = await db.student.groupBy({
    by: ['branch'],
    _count: { _all: true },
  })
  const branches = branchesRaw.map((b) => ({ branch: b.branch, count: b._count._all }))

  // Per-subject summary
  const subjectsRaw = await db.subject.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      totalClasses: true,
      _count: { select: { attendances: { where: { status: 'Present' } } } },
    },
  })
  const subjects = subjectsRaw.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    totalClasses: s.totalClasses,
    presentCount: s._count.attendances,
  }))

  // Low attendance count (students below 75%)
  const allStudents = await db.student.findMany({ select: { id: true, studentId: true, name: true } })
  let lowAttendanceCount = 0
  const lowAttendanceStudents: any[] = []

  for (const s of allStudents) {
    const total = await db.attendance.count({ where: { studentId: s.id } })
    if (total === 0) continue
    const present = await db.attendance.count({ where: { studentId: s.id, status: 'Present' } })
    const pct = (present / total) * 100
    if (pct < 75) {
      lowAttendanceCount++
      lowAttendanceStudents.push({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        present,
        total,
        percentage: Math.round(pct * 100) / 100,
      })
    }
  }

  // Sort low attendance by percentage asc
  lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage)

  return NextResponse.json({
    totalStudents,
    totalSubjects,
    todayClassesCount: todayClasses.length,
    overallSummary: {
      total: totalRecords,
      present: presentCount,
      absent: absentCount,
      percentage: Math.round(overallPercentage * 100) / 100,
    },
    branches,
    subjects,
    lowAttendanceCount,
    lowAttendanceStudents: lowAttendanceStudents.slice(0, 10),
  })
}
