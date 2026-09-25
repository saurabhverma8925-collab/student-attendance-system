import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/resources?subjectId=...
// Admin: returns all resources (optionally filtered by subject)
// Student: returns resources for their branch+semester subjects only
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const subjectId = url.searchParams.get('subjectId')

  let where: any = {}
  if (subjectId) where.subjectId = subjectId

  if (session.role === 'student') {
    // Students can only see resources for subjects in their branch+semester
    const student = await db.student.findUnique({
      where: { id: session.id },
      select: { branch: true, semester: true },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const subjects = await db.subject.findMany({
      where: { branch: student.branch, semester: student.semester },
      select: { id: true },
    })
    const subjectIds = subjects.map((s) => s.id)
    where.subjectId = subjectId && subjectIds.includes(subjectId) ? subjectId : { in: subjectIds }
  }

  const resources = await db.resource.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { subject: { select: { code: true, name: true, branch: true, semester: true } } },
  })
  return NextResponse.json({ resources })
}

// POST /api/resources — admin creates a new resource
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }
  const body = await req.json()
  const { subjectId, title, type, url, description, isFree } = body as any
  if (!subjectId || !title || !type || !url) {
    return NextResponse.json({ error: 'subjectId, title, type, url are required' }, { status: 400 })
  }
  const subject = await db.subject.findUnique({ where: { id: subjectId } })
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  const resource = await db.resource.create({
    data: {
      subjectId,
      title,
      type,
      url,
      description: description || null,
      isFree: isFree !== false,
    },
  })
  return NextResponse.json({ ok: true, resource })
}
