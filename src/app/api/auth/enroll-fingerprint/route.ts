import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// POST removed — students can no longer self-enroll fingerprints.
// Fingerprint enrollment is admin-only via POST /api/students/[id]/enroll-fingerprint.

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    message: 'Fingerprint enrollment is admin-only. Please contact your administrator.',
  })
}
