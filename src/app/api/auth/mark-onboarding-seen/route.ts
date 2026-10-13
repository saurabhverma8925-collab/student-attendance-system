import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/auth/mark-onboarding-seen
// Called by the student after they've viewed the one-time onboarding screen.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await db.student.update({
    where: { id: session.id },
    data: { hasSeenOnboarding: true },
  })
  return NextResponse.json({ ok: true })
}
