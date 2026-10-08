import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'
import { TEAM_SIZE } from '@/lib/java-portal'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Student access required' }, { status: 401 })
  const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json()
  const teamId = sanitizeString(body?.teamId, 50)
  const inviteeEmail = sanitizeString(body?.inviteeEmail, 254).toLowerCase()
  if (!teamId || !inviteeEmail) return NextResponse.json({ error: 'teamId and inviteeEmail are required' }, { status: 400 })
  const membership = await db.teamMember.findUnique({ where: { teamId_studentId: { teamId, studentId: session.id } } })
  if (!membership || membership.role !== 'Leader') return NextResponse.json({ error: 'Only the team leader can send invitations' }, { status: 403 })
  const team = await db.team.findUnique({ where: { id: teamId }, include: { members: true } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  if (team.status !== 'forming') return NextResponse.json({ error: 'Team is already finalized' }, { status: 400 })
  if (team.members.length >= TEAM_SIZE.MAX) return NextResponse.json({ error: `Team already has ${TEAM_SIZE.MAX} members (max)` }, { status: 400 })
  const existingInv = await db.teamInvitation.findFirst({ where: { teamId, inviteeEmail, status: 'pending' } })
  if (existingInv) return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 400 })
  const student = await db.student.findFirst({ where: { email: inviteeEmail } })
  if (student) {
    const alreadyMember = await db.teamMember.findUnique({ where: { teamId_studentId: { teamId, studentId: student.id } } })
    if (alreadyMember) return NextResponse.json({ error: 'This student is already a team member' }, { status: 400 })
  }
  const invitation = await db.teamInvitation.create({ data: { teamId, leaderStudentId: session.id, inviteeEmail, inviteeStudentId: student?.id || null } })
  return NextResponse.json({ ok: true, invitation })
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Student access required' }, { status: 401 })
  const student = await db.student.findUnique({ where: { id: session.id }, select: { email: true } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  const invitations = await db.teamInvitation.findMany({
    where: { inviteeEmail: student.email, status: 'pending' },
    include: { team: { include: { members: { include: { student: { select: { name: true, studentId: true } } } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ invitations })
}
