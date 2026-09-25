import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/students/[id]/reset-biometric
// Admin resets fingerprint enrollment for a student.
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

  await db.student.update({
    where: { id },
    data: {
      fingerprintEnrolled: false,
      fingerprintTemplateHash: null,
    },
  })

  return NextResponse.json({ ok: true, reset: true })
}
