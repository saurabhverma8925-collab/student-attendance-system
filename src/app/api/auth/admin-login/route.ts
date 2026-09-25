import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, hashPassword, verifyPassword, SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body as { username: string; password: string }
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }
    const admin = await db.admin.findUnique({ where: { username } })
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }
    const token = createSession({
      role: 'admin',
      id: admin.id,
      username: admin.username,
      name: admin.name,
    })
    const res = NextResponse.json({
      ok: true,
      user: { id: admin.id, username: admin.username, name: admin.name, role: 'admin' },
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Bootstrap default admin if none exists
export async function GET() {
  const count = await db.admin.count()
  if (count === 0) {
    await db.admin.create({
      data: {
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        name: 'System Administrator',
        role: 'admin',
      },
    })
    return NextResponse.json({ message: 'Default admin created (username=admin password=admin123)' })
  }
  return NextResponse.json({ adminCount: count })
}
