import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'

// GET /api/students?search=&branch=&section=&semester=
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const search = url.searchParams.get('search')?.trim() || ''
  const branch = url.searchParams.get('branch') || ''
  const section = url.searchParams.get('section') || ''
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
      fingerprintEnrolled: true,
      deviceFingerprint: true,
      deviceRegisteredAt: true,
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
  const body = await req.json()
  const { studentId, name, branch, section, semester, email, phone, password } = body as any
  if (!studentId || !name || !branch || !section || !semester) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
      semester: Number(semester),
      email: email || null,
      phone: phone || null,
      passwordHash: hashPassword(password || 'student123'),
    },
  })

  return NextResponse.json({ ok: true, student: { id: student.id, studentId: student.studentId } })
}
