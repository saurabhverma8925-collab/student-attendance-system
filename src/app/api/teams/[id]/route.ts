import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'
import { TEAM_SIZE } from '@/lib/java-portal'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const { id } = await ctx.params; const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json(); const status = sanitizeString(body?.status, 20); const facultyMentorId = sanitizeString(body?.facultyMentorId, 50)
  const team = await db.team.findUnique({ where: { id }, include: { members: true } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  const data: any = {}
  if (status && ['forming', 'finalized', 'locked'].includes(status)) {
    data.status = status
    if (status === 'finalized' && !team.finalizedAt) data.finalizedAt = new Date()
  }
  if (facultyMentorId) data.facultyMentorId = facultyMentorId
  if (status === 'finalized' && (team.members.length < TEAM_SIZE.MIN || team.members.length > TEAM_SIZE.MAX))
    return NextResponse.json({ error: `Cannot finalize — team must have ${TEAM_SIZE.MIN}-${TEAM_SIZE.MAX} members` }, { status: 400 })
  const updated = await db.team.update({ where: { id }, data })
  return NextResponse.json({ ok: true, team: updated })
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const { id } = await ctx.params
  await db.team.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
