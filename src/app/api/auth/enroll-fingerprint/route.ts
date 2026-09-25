import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Student enrolls fingerprint. We don't store raw biometric — only a hash
// of the locally captured fingerprint "template". In a real app this would
// use WebAuthn / platform authenticators; here we simulate the enrollment.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const { template } = body as { template?: string }
  // If no template provided, generate a server-side pseudo-template hash
  const raw = template || crypto.randomBytes(32).toString('hex')
  const templateHash = crypto.createHash('sha256').update(raw + session.id).digest('hex')

  await db.student.update({
    where: { id: session.id },
    data: {
      fingerprintEnrolled: true,
      fingerprintTemplateHash: templateHash,
    },
  })

  return NextResponse.json({ ok: true, enrolled: true })
}
