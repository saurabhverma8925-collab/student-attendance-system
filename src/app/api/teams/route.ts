import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { audit, getClientIp, getClientUa, sanitizeString } from '@/lib/security'
import { TEAM_SIZE } from '@/lib/java-portal'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.role === 'admin') {
    const teams = await db.team.findMany({
      include: {
        members: { include: { student: { select: { id: true, studentId: true, name: true, email: true } } } },
        reviewSubmissions: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ teams })
  } else {
    const tm = await db.teamMember.findFirst({
      where: { studentId: session.id },
      include: {
        team: {
          include: {
            members: { include: { student: { select: { id: true, studentId: true, name: true, email: true, branch: true, section: true } } } },
            reviewSubmissions: true,
          },
        },
      },
    })
    const student = await db.student.findUnique({ where: { id: session.id }, select: { email: true } })
    const invitations = await db.teamInvitation.findMany({
      where: { inviteeEmail: student?.email || '', status: 'pending' },
      include: { team: { include: { members: { include: { student: { select: { name: true, studentId: true } } } } } } },
    })
    return NextResponse.json({ team: tm?.team || null, role: tm?.role || null, invitations })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ip = getClientIp(req); const ua = getClientUa(req)
  const body = await req.json()
  const teamName = sanitizeString(body?.teamName, 60)
  const facultyMentorId = sanitizeString(body?.facultyMentorId, 50)
  const memberIds: string[] = Array.isArray(body?.memberIds) ? body.memberIds : []
  if (!teamName) return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
  const exists = await db.team.findUnique({ where: { teamName } })
  if (exists) return NextResponse.json({ error: 'Team name already taken' }, { status: 409 })

  if (session.role === 'admin') {
    if (!facultyMentorId) return NextResponse.json({ error: 'Faculty mentor is required' }, { status: 400 })
    if (memberIds.length < TEAM_SIZE.MIN || memberIds.length > TEAM_SIZE.MAX)
      return NextResponse.json({ error: `Team must have ${TEAM_SIZE.MIN}-${TEAM_SIZE.MAX} members` }, { status: 400 })
    const team = await db.team.create({
      data: { teamName, facultyMentorId, status: 'finalized', finalizedAt: new Date(),
        members: { create: memberIds.map((sid, i) => ({ studentId: sid, role: i === 0 ? 'Leader' : 'Member' })) } },
    })
    await audit({ actorId: session.id, actorRole: 'admin', action: 'team.create', target: team.id, ip, userAgent: ua, details: { teamName } })
    return NextResponse.json({ ok: true, team })
  }
  // Student leader creates a forming team
  const existingMember = await db.teamMember.findFirst({ where: { studentId: session.id } })
  if (existingMember) return NextResponse.json({ error: 'You are already in a team' }, { status: 400 })
  const admin = await db.admin.findFirst()
  if (!admin) return NextResponse.json({ error: 'No faculty available' }, { status: 400 })
  const team = await db.team.create({
    data: { teamName, facultyMentorId: admin.id, status: 'forming',
      members: { create: [{ studentId: session.id, role: 'Leader' }] } },
  })
  return NextResponse.json({ ok: true, team })
}
