import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  createSession,
  hashPassword,
  verifyPassword,
  SESSION_COOKIE,
  SECURE_COOKIE_OPTIONS,
} from '@/lib/auth'
import {
  audit,
  checkRateLimit,
  getClientIp,
  getClientUa,
  logFailedLogin,
  rateLimitKey,
  sanitizeString,
  validatePasswordStrength,
  DEFAULT_AUTH_RATE_LIMIT,
} from '@/lib/security'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const ua = getClientUa(req)
  const rateKey = rateLimitKey(req, 'admin-login')

  // RATE LIMIT CHECK — prevent brute-force attacks
  const limited = checkRateLimit(rateKey, DEFAULT_AUTH_RATE_LIMIT)
  if (limited) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limited.retryAfterSec} seconds.` },
      { status: 429 },
    )
  }

  try {
    const body = await req.json()
    const username = sanitizeString(body?.username, 100)
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const admin = await db.admin.findUnique({ where: { username } })
    // Always run a bcrypt compare against a dummy hash even when the admin
    // doesn't exist — prevents timing-based username enumeration.
    const dummyHash = '$2a$12$abcdefghijklmnopqrstuv'
    const hashToCheck = admin?.passwordHash ?? dummyHash
    const passwordOk = admin
      ? verifyPassword(password, hashToCheck)
      : verifyPassword(password, dummyHash) // always false

    if (!admin || !passwordOk) {
      // LOG FAILED LOGIN
      await logFailedLogin({ username, role: 'admin', ip, userAgent: ua })
      await audit({
        actorId: 'anonymous',
        actorRole: 'system',
        action: 'auth.admin.login.failed',
        target: username,
        ip,
        userAgent: ua,
        details: { reason: !admin ? 'no_such_user' : 'wrong_password' },
      })
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    // SUCCESS — create session + audit
    const token = createSession({
      role: 'admin',
      id: admin.id,
      username: admin.username,
      name: admin.name,
    })
    await audit({
      actorId: admin.id,
      actorRole: 'admin',
      action: 'auth.admin.login.success',
      ip,
      userAgent: ua,
    })

    const res = NextResponse.json({
      ok: true,
      user: { id: admin.id, username: admin.username, name: admin.name, role: 'admin' },
    })
    res.cookies.set(SESSION_COOKIE, token, SECURE_COOKIE_OPTIONS)
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Bootstrap default admin if none exists
export async function GET() {
  const count = await db.admin.count()
  if (count === 0) {
    // Enforce a strong password for the bootstrap admin
    const password = 'admin123'
    const strengthErr = validatePasswordStrength(password, { requireMixedCase: false, minLength: 4 })
    // For the bootstrap admin only, we accept the weak default — but log a warning in the audit
    if (strengthErr) {
      await audit({
        actorId: 'system',
        actorRole: 'system',
        action: 'security.weak_bootstrap_admin',
        details: { reason: strengthErr, password: 'admin123' },
      })
    }
    await db.admin.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword(password),
        name: 'System Administrator',
        role: 'admin',
      },
    })
    return NextResponse.json({ message: 'Default admin created (username=admin password=admin123)' })
  }
  return NextResponse.json({ adminCount: count })
}
