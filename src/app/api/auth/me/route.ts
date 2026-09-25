import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ user: null })

  if (session.role === 'admin') {
    const admin = await db.admin.findUnique({ where: { id: session.id } })
    if (!admin) return NextResponse.json({ user: null })
    return NextResponse.json({
      user: { id: admin.id, username: admin.username, name: admin.name, role: 'admin' },
    })
  } else {
    const student = await db.student.findUnique({ where: { id: session.id } })
    if (!student) return NextResponse.json({ user: null })
    return NextResponse.json({
      user: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        role: 'student',
        fingerprintEnrolled: student.fingerprintEnrolled,
        deviceFingerprint: student.deviceFingerprint,
        hasSeenOnboarding: student.hasSeenOnboarding,
        branch: student.branch,
        section: student.section,
        semester: student.semester,
      },
    })
  }
}
