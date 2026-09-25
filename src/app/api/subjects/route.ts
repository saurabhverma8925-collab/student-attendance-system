import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const branch = url.searchParams.get('branch')

  const where: any = {}
  if (branch) where.branch = branch

  const subjects = await db.subject.findMany({
    where,
    orderBy: { code: 'asc' },
  })
  return NextResponse.json({ subjects })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { code, name, branch, semester } = body as any
  if (!code || !name || !branch || !semester) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const exists = await db.subject.findUnique({ where: { code } })
  if (exists) return NextResponse.json({ error: 'Subject code already exists' }, { status: 409 })

  const subject = await db.subject.create({
    data: { code, name, branch, semester: Number(semester) },
  })
  return NextResponse.json({ ok: true, subject })
}
