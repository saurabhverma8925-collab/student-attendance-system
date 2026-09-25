import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// One device per student. We use a browser fingerprint hash
// (canvas + user-agent + screen + timezone) generated client-side.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const { deviceFingerprint } = body as { deviceFingerprint: string }
  if (!deviceFingerprint) {
    return NextResponse.json({ error: 'deviceFingerprint is required' }, { status: 400 })
  }

  const student = await db.student.findUnique({ where: { id: session.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // If student already has a device registered and it doesn't match → reject
  if (student.deviceFingerprint && student.deviceFingerprint !== deviceFingerprint) {
    return NextResponse.json(
      { error: 'Another device is already registered for this student. One device per student allowed.' },
      { status: 403 },
    )
  }

  await db.student.update({
    where: { id: session.id },
    data: {
      deviceFingerprint,
      deviceRegisteredAt: new Date(),
    },
  })

  // Also record in DeviceRegistration table (upsert since unique on studentId)
  await db.deviceRegistration.upsert({
    where: { studentId: session.id },
    create: {
      studentId: session.id,
      deviceFingerprint,
      userAgent: req.headers.get('user-agent') ?? 'unknown',
    },
    update: {
      deviceFingerprint,
      userAgent: req.headers.get('user-agent') ?? 'unknown',
      registeredAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true, registered: true })
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const student = await db.student.findUnique({
    where: { id: session.id },
    select: { deviceFingerprint: true, deviceRegisteredAt: true, fingerprintEnrolled: true },
  })
  return NextResponse.json({ device: student })
}
