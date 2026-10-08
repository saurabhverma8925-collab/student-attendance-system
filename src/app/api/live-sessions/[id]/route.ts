import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  const { id } = await ctx.params
  await db.liveSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
