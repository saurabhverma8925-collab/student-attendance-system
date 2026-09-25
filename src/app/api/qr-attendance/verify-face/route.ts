import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'

// POST /api/qr-attendance/verify-face
// Student submits: { token, capturedPhoto (base64) }
// Server:
//   1. Verifies the QR session is active and not expired
//   2. Checks the student belongs to the subject's branch + semester
//   3. Records the captured photo as a SHA-256 hash (privacy)
//   4. Marks attendance as "Present" (creates Attendance row, QRScan row)
//   5. Returns success with student name + subject info
export async function POST(req: NextRequest) {
  const token = req.cookies.get('sas_session')?.value
  const session = getSession(token)
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Student access required' }, { status: 401 })
  }
  const body = await req.json()
  const { token: qrToken, capturedPhoto } = body as { token: string; capturedPhoto?: string }
  if (!qrToken) {
    return NextResponse.json({ error: 'QR token is required' }, { status: 400 })
  }

  // 1. Find the QR session
  const qr = await db.qRSession.findUnique({
    where: { token: qrToken },
    include: { subject: true },
  })
  if (!qr) return NextResponse.json({ error: 'Invalid QR token' }, { status: 404 })
  if (!qr.isActive) return NextResponse.json({ error: 'This QR session is no longer active' }, { status: 410 })
  if (qr.expiresAt < new Date()) {
    await db.qRSession.update({ where: { id: qr.id }, data: { isActive: false } })
    return NextResponse.json({ error: 'This QR code has expired. Ask admin for a new one.' }, { status: 410 })
  }

  // 2. Check the student belongs to this subject's branch + semester
  const student = await db.student.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      studentId: true,
      name: true,
      branch: true,
      semester: true,
      section: true,
      deviceFingerprint: true,
    },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  if (student.branch !== qr.subject.branch || student.semester !== qr.subject.semester) {
    return NextResponse.json(
      { error: `You are not enrolled in ${qr.subject.code} (${qr.subject.branch} / Sem ${qr.subject.semester})` },
      { status: 403 },
    )
  }

  // 3. Already marked? (idempotent — return success)
  const existingScan = await db.qRScan.findUnique({
    where: { qrSessionId_studentId: { qrSessionId: qr.id, studentId: student.id } },
  })
  if (existingScan) {
    return NextResponse.json({
      ok: true,
      alreadyMarked: true,
      studentName: student.name,
      studentId: student.studentId,
      subject: { code: qr.subject.code, name: qr.subject.name },
      markedAt: existingScan.createdAt.toISOString(),
    })
  }

  // 4. Face verification (simulated — store hash of captured photo)
  // In production: integrate a face recognition service (e.g. AWS Rekognition,
  // Azure Face API, or a local OpenCV model). Here we just record the hash.
  const photoHash = capturedPhoto
    ? crypto.createHash('sha256').update(capturedPhoto).digest('hex')
    : null

  // 5. Mark attendance (upsert to Attendance table) + record QRScan
  await db.$transaction(async (tx) => {
    await tx.attendance.upsert({
      where: {
        studentId_subjectId_date: {
          studentId: student.id,
          subjectId: qr.subjectId,
          date: qr.date,
        },
      },
      create: {
        studentId: student.id,
        subjectId: qr.subjectId,
        date: qr.date,
        status: 'Present',
        markedBy: qr.createdBy,
        markedVia: 'qr-face',
      },
      update: {
        status: 'Present',
        markedBy: qr.createdBy,
        markedVia: 'qr-face',
      },
    })

    await tx.qRScan.create({
      data: {
        qrSessionId: qr.id,
        studentId: student.id,
        subjectId: qr.subjectId,
        date: qr.date,
        faceVerified: true,
        capturedPhotoHash: photoHash,
      },
    })

    // Update subject.totalClasses = distinct dates attendance recorded
    const distinctDates = await tx.attendance.findMany({
      where: { subjectId: qr.subjectId },
      select: { date: true },
      distinct: ['date'],
    })
    await tx.subject.update({
      where: { id: qr.subjectId },
      data: { totalClasses: distinctDates.length },
    })
  })

  return NextResponse.json({
    ok: true,
    alreadyMarked: false,
    studentName: student.name,
    studentId: student.studentId,
    subject: { code: qr.subject.code, name: qr.subject.name },
    date: qr.date.toISOString(),
    markedAt: new Date().toISOString(),
  })
}
