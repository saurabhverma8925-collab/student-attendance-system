import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sanitizeString } from '@/lib/security'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const search = sanitizeString(url.searchParams.get('search'), 100)
  const where: any = {}
  if (category && category !== 'all') where.category = category
  if (search) where.title = { contains: search }
  const topics = await db.presetTopic.findMany({ where, orderBy: { category: 'asc' } })
  return NextResponse.json({ topics, count: topics.length })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const body = await req.json()
  const title = sanitizeString(body?.title, 200)
  const description = sanitizeString(body?.description, 1000)
  const category = sanitizeString(body?.category, 30) || 'General'
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const topic = await db.presetTopic.create({ data: { title, description, category } })
  return NextResponse.json({ ok: true, topic })
}
