import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const now = new Date()
  const sessions = await db.liveSession.findMany({ where: { sessionDate: { gte: now } }, orderBy: { sessionDate: 'asc' } })
  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json()
  const title = sanitizeString(body?.title, 200)
  const description = sanitizeString(body?.description, 1000)
  const sessionDateStr = sanitizeString(body?.sessionDate, 30)
  const dayOfWeek = sanitizeString(body?.dayOfWeek, 20)
  const startTime = sanitizeString(body?.startTime, 10)
  const endTime = sanitizeString(body?.endTime, 10)
  const meetingUrl = sanitizeString(body?.meetingUrl, 500)
  if (!title || !sessionDateStr || !dayOfWeek || !startTime || !endTime || !meetingUrl)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  if (!['Sunday', 'Monday'].includes(dayOfWeek)) return NextResponse.json({ error: 'Sessions must be on Sunday or Monday' }, { status: 400 })
  const sessionDate = new Date(sessionDateStr)
  if (isNaN(sessionDate.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  const live = await db.liveSession.create({ data: { title, description, sessionDate, dayOfWeek, startTime, endTime, meetingUrl, meetingType: 'google_meet' } })
  return NextResponse.json({ ok: true, session: live })
}
