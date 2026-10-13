import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, countActiveSessions } from '@/lib/auth'

// GET /api/security/overview
// Returns: failed login attempts (last 24h), recent audit log (last 50 entries),
//          active sessions count, password policy, list of admins
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Failed login attempts in last 24h
  const failedAttempts24h = await db.failedLoginAttempt.count({
    where: { createdAt: { gte: dayAgo } },
  })
  const failedAttemptsList = await db.failedLoginAttempt.findMany({
    where: { createdAt: { gte: dayAgo } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Recent audit log entries (last 50)
  const recentAudit = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  // Top actors by action count (last 7 days)
  const auditByAction = await db.auditLog.groupBy({
    by: ['action'],
    where: { createdAt: { gte: weekAgo } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })

  // Count admins + students
  const adminCount = await db.admin.count()
  const studentCount = await db.student.count()

  // Password policy status — count students with weak passwords
  const students = await db.student.findMany({
    select: { passwordPlain: true, studentId: true, name: true },
  })
  const weakPasswordCount = students.filter((s) => {
    const p = s.passwordPlain || ''
    return p.length < 8 || !/[a-zA-Z]/.test(p) || !/\d/.test(p)
  }).length
  const weakPasswordStudents = students
    .filter((s) => {
      const p = s.passwordPlain || ''
      return p.length < 8 || !/[a-zA-Z]/.test(p) || !/\d/.test(p)
    })
    .slice(0, 10)
    .map((s) => ({ studentId: s.studentId, name: s.name, passwordLength: (s.passwordPlain || '').length }))

  return NextResponse.json({
    failedAttempts24h,
    failedAttemptsList: failedAttemptsList.map((f) => ({
      id: f.id,
      username: f.username,
      role: f.role,
      ip: f.ip,
      createdAt: f.createdAt.toISOString(),
    })),
    recentAudit: recentAudit.map((a) => ({
      id: a.id,
      actorId: a.actorId,
      actorRole: a.actorRole,
      action: a.action,
      target: a.target,
      ip: a.ip,
      createdAt: a.createdAt.toISOString(),
      details: a.details,
    })),
    auditByAction: auditByAction.map((a) => ({
      action: a.action,
      count: a._count._all,
    })),
    activeSessionCount: countActiveSessions(),
    adminCount,
    studentCount,
    passwordPolicy: {
      minLength: 8,
      requireLetters: true,
      requireDigits: true,
      weakPasswordCount,
      weakPasswordStudents,
    },
    rateLimit: {
      auth: { maxAttempts: 10, windowMinutes: 1, blockMinutes: 5 },
      qrVerify: { maxAttempts: 30, windowMinutes: 1, blockMinutes: 2 },
    },
    sessionExpiryHours: 8,
    securityHeaders: [
      'Content-Security-Policy',
      'X-Frame-Options: DENY',
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      'Permissions-Policy: camera=(self), microphone=(self)',
      'HSTS (production only)',
    ],
  })
}
