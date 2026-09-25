import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'

// POST /api/students/[id]/register-device
// Admin registers a new device on behalf of a student.
// This enforces one-device-per-student by overwriting any existing binding
// (admin override — different from student self-registration which is rejected).
// Body: { deviceFingerprint?: string, userAgent?: string }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }
  const { id } = await ctx.params
  const student = await db.student.findUnique({ where: { id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  // Admin can either supply a known device fingerprint (e.g., scanned from
  // the student's physical device) or let the server generate a stable one.
  const deviceFingerprint =
    (body as { deviceFingerprint?: string }).deviceFingerprint ||
    crypto.createHash('sha256').update(`admin-registered:${student.id}:${Date.now()}`).digest('hex')
  const userAgent = (body as { userAgent?: string }).userAgent || req.headers.get('user-agent') || 'admin-registered'

  await db.student.update({
    where: { id },
    data: {
      deviceFingerprint,
      deviceRegisteredAt: new Date(),
    },
  })

  // Upsert into DeviceRegistration table (unique on studentId)
  await db.deviceRegistration.upsert({
    where: { studentId: id },
    create: { studentId: id, deviceFingerprint, userAgent },
    update: { deviceFingerprint, userAgent, registeredAt: new Date() },
  })

  return NextResponse.json({
    ok: true,
    registered: true,
    deviceFingerprint,
    registeredAt: new Date().toISOString(),
  })
}
