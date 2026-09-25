import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// GET — student fetches their own device status (read-only)
export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const student = await db.student.findUnique({
    where: { id: session.id },
    select: {
      deviceFingerprint: true,
      deviceRegisteredAt: true,
      fingerprintEnrolled: true,
    },
  })
  return NextResponse.json({ device: student })
}

// POST removed — students can no longer self-register devices.
// Device registration is admin-only via POST /api/students/[id]/register-device.
