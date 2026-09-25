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
      fingerprintEnrolled: true,
      deviceFingerprint: true,
      deviceRegisteredAt: true,
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
  const { name, branch, section, semester, email, phone, password, resetFingerprint, resetDevice } = body as any

  const data: any = {}
  if (name) data.name = name
  if (branch) data.branch = branch
  if (section) data.section = section
  if (semester) data.semester = Number(semester)
  if (email !== undefined) data.email = email || null
  if (phone !== undefined) data.phone = phone || null
  if (password) data.passwordHash = hashPassword(password)
  if (resetFingerprint) {
    data.fingerprintEnrolled = false
    data.fingerprintTemplateHash = null
  }
  if (resetDevice) {
    data.deviceFingerprint = null
    data.deviceRegisteredAt = null
  }

  const updated = await db.student.update({ where: { id }, data })
  return NextResponse.json({ ok: true, studentId: updated.studentId })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = _req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await ctx.params
  await db.student.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
