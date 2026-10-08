import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'
import { TEAM_SIZE } from '@/lib/java-portal'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Student access required' }, { status: 401 })
  const { id } = await ctx.params; const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json(); const status = sanitizeString(body?.status, 20)
  if (!['accepted', 'declined'].includes(status)) return NextResponse.json({ error: 'status must be "accepted" or "declined"' }, { status: 400 })
  const invitation = await db.teamInvitation.findUnique({ where: { id }, include: { team: { include: { members: true } } } })
  if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  if (invitation.status !== 'pending') return NextResponse.json({ error: 'Invitation already responded to' }, { status: 400 })
  const student = await db.student.findUnique({ where: { id: session.id }, select: { email: true } })
  if (!student || student.email !== invitation.inviteeEmail) return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 })
  await db.teamInvitation.update({ where: { id }, data: { status, respondedAt: new Date(), inviteeStudentId: session.id } })
  if (status === 'accepted') {
    if (invitation.team.status !== 'forming') return NextResponse.json({ error: 'Team is no longer accepting members' }, { status: 400 })
    if (invitation.team.members.length >= TEAM_SIZE.MAX) return NextResponse.json({ error: `Team already has ${TEAM_SIZE.MAX} members` }, { status: 400 })
    const existingMember = await db.teamMember.findFirst({ where: { studentId: session.id } })
    if (existingMember) return NextResponse.json({ error: 'You are already in another team' }, { status: 400 })
    await db.teamMember.create({ data: { teamId: invitation.teamId, studentId: session.id, role: 'Member' } })
  }
  return NextResponse.json({ ok: true, status })
}
