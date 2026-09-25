import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, SESSION_COOKIE } from '@/lib/auth'

// POST /api/auth/biometric-login
// Student scans fingerprint to log in (instead of typing password).
// In a real app this would use WebAuthn / PublicKeyCredential to verify
// the biometric against the stored template. Here we simulate: if the
// student has `fingerprintEnrolled = true`, login succeeds (the browser
// is the same one that originally completed onboarding — we trust the
// cookie session).
//
// Body: { username: string }  (studentId / roll no)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username } = body as { username: string }
    if (!username) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }
    const student = await db.student.findUnique({ where: { studentId: username } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (!student.fingerprintEnrolled) {
      return NextResponse.json(
        { error: 'Fingerprint not enrolled. Please log in with password first.' },
        { status: 403 },
      )
    }
    // Simulate biometric verification (in production: WebAuthn challenge/response)
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
        hasSeenOnboarding: student.hasSeenOnboarding,
        branch: student.branch,
        section: student.section,
        semester: student.semester,
      },
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
