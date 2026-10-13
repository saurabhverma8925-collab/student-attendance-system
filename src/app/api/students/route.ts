import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'
import {
  audit,
  getClientIp,
  getClientUa,
  sanitizeString,
  validateEmail,
  validatePasswordStrength,
  validatePhone,
  validateStudentId,
} from '@/lib/security'

// GET /api/students?search=&branch=&section=&semester=
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const search = sanitizeString(url.searchParams.get('search'), 100)
  const branch = sanitizeString(url.searchParams.get('branch'), 20)
  const section = sanitizeString(url.searchParams.get('section'), 5)
  const semester = url.searchParams.get('semester')

  const where: any = {}
  if (search) {
    where.OR = [
      { studentId: { contains: search } },
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]
  }
  if (branch) where.branch = branch
  if (section) where.section = section
  if (semester) where.semester = Number(semester)

  const students = await db.student.findMany({
    where,
    orderBy: { studentId: 'asc' },
    select: {
      id: true,
      studentId: true,
      name: true,
      branch: true,
      section: true,
      semester: true,
      email: true,
      phone: true,
      passwordPlain: true,
      deviceFingerprint: true,
      deviceRegisteredAt: true,
      hasSeenOnboarding: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ students })
}

// POST /api/students — create new student
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const ip = getClientIp(req)
  const ua = getClientUa(req)

  try {
    const body = await req.json()
    // SANITIZE ALL INPUTS
    const studentId = sanitizeString(body?.studentId, 30)
    const name = sanitizeString(body?.name, 100)
    const branch = sanitizeString(body?.branch, 20)
    const section = sanitizeString(body?.section, 5)
    const semester = Number(body?.semester)
    const email = sanitizeString(body?.email, 254)
    const phone = sanitizeString(body?.phone, 20)
    const password = typeof body?.password === 'string' ? body.password : ''
    const registerDevice = !!body?.registerDevice

    if (!studentId || !name || !branch || !section || !semester) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!validateStudentId(studentId)) {
      return NextResponse.json(
        { error: 'Student ID must be 3-30 alphanumeric characters (dashes allowed)' },
        { status: 400 },
      )
    }
    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }
    if (!Number.isFinite(semester) || semester < 1 || semester > 12) {
      return NextResponse.json({ error: 'Semester must be between 1 and 12' }, { status: 400 })
    }

    // PASSWORD STRENGTH VALIDATION — min 8 chars + letters + digits
    const strengthErr = validatePasswordStrength(password, { requireMixedCase: false, minLength: 8 })
    if (strengthErr) {
      return NextResponse.json({ error: strengthErr }, { status: 400 })
    }

    // Duplicate check
    const exists = await db.student.findUnique({ where: { studentId } })
    if (exists) return NextResponse.json({ error: 'Student ID already exists' }, { status: 409 })

    const student = await db.student.create({
      data: {
        studentId,
        name,
        branch,
        section,
        semester,
        email: email || null,
        phone: phone || null,
        passwordHash: hashPassword(password),
        passwordPlain: password,
      },
    })

    // Optionally register a device on the student's behalf
    if (registerDevice) {
      const crypto = await import('crypto')
      const deviceFingerprint = crypto.createHash('sha256').update(`admin-registered:${student.id}:${Date.now()}`).digest('hex')
      const userAgent = req.headers.get('user-agent') || 'admin-registered'
      await db.student.update({
        where: { id: student.id },
        data: { deviceFingerprint, deviceRegisteredAt: new Date() },
      })
      await db.deviceRegistration.upsert({
        where: { studentId: student.id },
        create: { studentId: student.id, deviceFingerprint, userAgent },
        update: { deviceFingerprint, userAgent, registeredAt: new Date() },
      })
    }

    // AUDIT LOG
    await audit({
      actorId: session.id,
      actorRole: 'admin',
      action: 'student.create',
      target: student.id,
      ip,
      userAgent: ua,
      details: { studentId, name, branch, registerDevice },
    })

    return NextResponse.json({ ok: true, student: { id: student.id, studentId: student.studentId } })
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
