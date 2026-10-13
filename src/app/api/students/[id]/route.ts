import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = _req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  const student = await db.student.findUnique({
    where: { id },
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
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Aggregate attendance for this student
  const records = await db.attendance.groupBy({
    by: ['subjectId', 'status'],
    where: { studentId: id },
    _count: { _all: true },
  })

  return NextResponse.json({ student, attendance: records })
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  const body = await req.json()
  const { name, branch, section, semester, email, phone, password } = body as any

  const data: any = {}
  if (name) data.name = name
  if (branch) data.branch = branch
  if (section) data.section = section
  if (semester) data.semester = Number(semester)
  if (email !== undefined) data.email = email || null
  if (phone !== undefined) data.phone = phone || null
  if (password && password.length >= 4) {
    data.passwordHash = hashPassword(password)
    data.passwordPlain = password
  }

  const updated = await db.student.update({ where: { id }, data })
  return NextResponse.json({ ok: true, studentId: updated.studentId })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params

  // Find the student first (so we can record who got deleted in the audit log)
  const student = await db.student.findUnique({
    where: { id },
    select: { id: true, studentId: true, name: true, branch: true },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  await db.student.delete({ where: { id } })

  // AUDIT LOG
  await audit({
    actorId: session.id,
    actorRole: 'admin',
    action: 'student.delete',
    target: id,
    ip: req.headers.get('x-forwarded-for') || null,
    userAgent: req.headers.get('user-agent'),
    details: { studentId: student.studentId, name: student.name, branch: student.branch },
  })

  return NextResponse.json({ ok: true })
}
