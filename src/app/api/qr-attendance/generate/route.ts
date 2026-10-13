import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'
import QRCode from 'qrcode'

// POST /api/qr-attendance/generate
// Admin generates a new QR code for a subject+date.
// Returns: { token, qrDataUrl, expiresAt }
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 401 })
  }
  const body = await req.json()
  const { subjectId, date, durationMinutes } = body as {
    subjectId: string
    date?: string
    durationMinutes?: number
  }
  if (!subjectId) {
    return NextResponse.json({ error: 'subjectId is required' }, { status: 400 })
  }
  const subject = await db.subject.findUnique({ where: { id: subjectId } })
  if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 })

  // Normalize the date to start-of-day UTC. The date input from the browser
  // gives "YYYY-MM-DD" which `new Date(...)` parses as midnight UTC — but
  // some callers may send ISO timestamps with hours/minutes. Strip those so
  // the stored date always matches the admin's "active" query (which also
  // normalizes to midnight UTC).
  const classDate = date ? normalizeToStartOfDay(date) : normalizeToStartOfDay(new Date().toISOString())
  if (isNaN(classDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }
  const mins = durationMinutes && durationMinutes > 0 ? durationMinutes : 10
  // ExpiresAt is a real timestamp — used to detect expiry vs. active status
  const expiresAt = new Date(Date.now() + mins * 60 * 1000)

  // Deactivate any previous active QR sessions for the same subject+date
  await db.qRSession.updateMany({
    where: { subjectId, date: classDate, isActive: true },
    data: { isActive: false },
  })

  const qrToken = crypto.randomBytes(16).toString('hex')
  const qrSession = await db.qRSession.create({
    data: {
      token: qrToken,
      subjectId,
      date: classDate,
      createdBy: session.id,
      expiresAt,
      isActive: true,
    },
    include: { subject: { select: { code: true, name: true } } },
  })

  // Generate QR code as data URL (PNG)
  // The QR payload is just the token — the student app will POST it to /api/qr-attendance/verify-face
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M',
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  return NextResponse.json({
    token: qrToken,
    qrDataUrl,
    subject: qrSession.subject,
    date: classDate.toISOString(),
    expiresAt: expiresAt.toISOString(),
    durationMinutes: mins,
  })
}

// Helper: normalize any date input (YYYY-MM-DD or ISO timestamp) to start-of-day UTC
function normalizeToStartOfDay(input: string | Date): Date {
  const d = input instanceof Date ? input : new Date(input)
  if (isNaN(d.getTime())) return new Date(NaN)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
