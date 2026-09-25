import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, hashPassword, verifyPassword, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body as { username: string; password: string }
    if (!username || !password) {
      return NextResponse.json({ error: 'Student ID and password are required' }, { status: 400 })
    }
    const student = await db.student.findUnique({ where: { studentId: username } })
    if (!student || !verifyPassword(password, student.passwordHash)) {
      return NextResponse.json({ error: 'Invalid student credentials' }, { status: 401 })
    }
    const token = createSession({
      role: 'student',
      id: student.id,
      studentId: student.studentId,
      name: student.name,
    })
    const res = NextResponse.json({
      ok: true,
      user: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        role: 'student',
        fingerprintEnrolled: student.fingerprintEnrolled,
        deviceFingerprint: student.deviceFingerprint,
      },
    })
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8 })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Bootstrap a default student if none exists
export async function GET() {
  const count = await db.student.count()
  if (count === 0) {
    await db.student.create({
      data: {
        studentId: 'CSE21001',
        name: 'Aarav Sharma',
        branch: 'CSE',
        section: 'A',
        semester: 3,
        passwordHash: hashPassword('student123'),
        email: 'aarav@college.edu',
        phone: '9876543210',
      },
    })
    return NextResponse.json({ message: 'Default student created (studentId=CSE21001 password=student123)' })
  }
  return NextResponse.json({ studentCount: count })
}
