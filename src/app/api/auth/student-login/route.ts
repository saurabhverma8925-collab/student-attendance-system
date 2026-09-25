import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createSession,
  hashPassword,
  verifyPassword,
  SESSION_COOKIE,
  SECURE_COOKIE_OPTIONS,
} from '@/lib/auth'
import {
  audit,
  checkRateLimit,
  getClientIp,
  getClientUa,
  logFailedLogin,
  rateLimitKey,
  sanitizeString,
  DEFAULT_AUTH_RATE_LIMIT,
} from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const ua = getClientUa(req)
  const rateKey = rateLimitKey(req, 'student-login')

  // RATE LIMIT CHECK
  const limited = checkRateLimit(rateKey, DEFAULT_AUTH_RATE_LIMIT)
  if (limited) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limited.retryAfterSec} seconds.` },
      { status: 429 },
    )
  }

  try {
    const body = await req.json()
    const username = sanitizeString(body?.username, 100)
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!username || !password) {
      return NextResponse.json({ error: 'Student ID and password are required' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { studentId: username } })
    // Constant-time dummy compare to prevent username enumeration
    const dummyHash = '$2a$12$abcdefghijklmnopqrstuv'
    const hashToCheck = student?.passwordHash ?? dummyHash
    const passwordOk = student
      ? verifyPassword(password, hashToCheck)
      : verifyPassword(password, dummyHash)

    if (!student || !passwordOk) {
      await logFailedLogin({ username, role: 'student', ip, userAgent: ua })
      await audit({
        actorId: 'anonymous',
        actorRole: 'system',
        action: 'auth.student.login.failed',
        target: username,
        ip,
        userAgent: ua,
        details: { reason: !student ? 'no_such_user' : 'wrong_password' },
      })
      return NextResponse.json({ error: 'Invalid student credentials' }, { status: 401 })
    }

    const token = createSession({
      role: 'student',
      id: student.id,
      studentId: student.studentId,
      name: student.name,
    })
    await audit({
      actorId: student.id,
      actorRole: 'student',
      action: 'auth.student.login.success',
      target: student.studentId,
      ip,
      userAgent: ua,
    })

    const res = NextResponse.json({
      ok: true,
      user: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        role: 'student',
        deviceFingerprint: student.deviceFingerprint,
        hasSeenOnboarding: student.hasSeenOnboarding,
        branch: student.branch,
        section: student.section,
        semester: student.semester,
      },
    })
    res.cookies.set(SESSION_COOKIE, token, SECURE_COOKIE_OPTIONS)
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
        passwordPlain: 'student123',
        email: 'aarav@college.edu',
        phone: '9876543210',
      },
    })
    return NextResponse.json({ message: 'Default student created (studentId=CSE21001 password=student123)' })
  }
  return NextResponse.json({ studentCount: count })
}
