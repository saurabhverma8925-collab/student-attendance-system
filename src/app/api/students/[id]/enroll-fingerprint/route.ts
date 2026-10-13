import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'

// POST /api/students/[id]/enroll-fingerprint
// Admin enrolls fingerprint on behalf of a student.
// Body: { template?: string } — if not provided, server generates a pseudo-template hash.
// We never store raw biometric — only SHA-256 hash.
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
  const raw = (body as { template?: string }).template || crypto.randomBytes(32).toString('hex')
  const templateHash = crypto.createHash('sha256').update(raw + ':' + student.id).digest('hex')

  await db.student.update({
    where: { id },
    data: {
      fingerprintEnrolled: true,
      fingerprintTemplateHash: templateHash,
    },
  })

  return NextResponse.json({
    ok: true,
    enrolled: true,
    templateHash,
    enrolledAt: new Date().toISOString(),
  })
}
