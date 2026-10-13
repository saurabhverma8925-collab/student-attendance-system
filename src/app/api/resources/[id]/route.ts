import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }
  const { id } = await ctx.params
  const body = await req.json()
  const { title, type, url, description, isFree } = body as any
  const data: any = {}
  if (title) data.title = title
  if (type) data.type = type
  if (url) data.url = url
  if (description !== undefined) data.description = description || null
  if (isFree !== undefined) data.isFree = isFree

  const updated = await db.resource.update({ where: { id }, data })
  return NextResponse.json({ ok: true, resource: updated })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }
  const { id } = await ctx.params
  await db.resource.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
