import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

// Idempotent: only adds students that don't already exist.
async function main() {
  const studentsData = [
    { studentId: 'CSE21001', name: 'Aarav Sharma', branch: 'CSE', section: 'A', semester: 3, email: 'aarav@college.edu', phone: '9876543210' },
    { studentId: 'CSE21002', name: 'Diya Patel', branch: 'CSE', section: 'A', semester: 3, email: 'diya@college.edu', phone: '9876543211' },
    { studentId: 'CSE21003', name: 'Vivaan Gupta', branch: 'CSE', section: 'A', semester: 3, email: 'vivaan@college.edu', phone: '9876543212' },
    { studentId: 'CSE21004', name: 'Ananya Reddy', branch: 'CSE', section: 'B', semester: 3, email: 'ananya@college.edu', phone: '9876543213' },
    { studentId: 'CSE21005', name: 'Aditya Nair', branch: 'CSE', section: 'B', semester: 3, email: 'aditya@college.edu', phone: '9876543214' },
    { studentId: 'CSE21006', name: 'Ishaan Verma', branch: 'CSE', section: 'B', semester: 3, email: 'ishaan@college.edu', phone: '9876543215' },
    { studentId: 'CSE21007', name: 'Saanvi Iyer', branch: 'CSE', section: 'A', semester: 3, email: 'saanvi@college.edu', phone: '9876543216' },
    { studentId: 'CSE21008', name: 'Arjun Mehta', branch: 'CSE', section: 'A', semester: 3, email: 'arjun@college.edu', phone: '9876543217' },
    { studentId: 'ECE21001', name: 'Kavya Singh', branch: 'ECE', section: 'A', semester: 3, email: 'kavya@college.edu', phone: '9876543218' },
    { studentId: 'ECE21002', name: 'Rohan Das', branch: 'ECE', section: 'A', semester: 3, email: 'rohan@college.edu', phone: '9876543219' },
  ]

  let added = 0
  let skipped = 0
  for (const s of studentsData) {
    const existing = await db.student.findUnique({ where: { studentId: s.studentId } })
    if (existing) {
      skipped++
      continue
    }
    await db.student.create({
      data: {
        ...s,
        passwordHash: hashPassword('student123'),
        passwordPlain: 'student123',
        fingerprintEnrolled: false,
      },
    })
    added++
  }
  console.log(`Added ${added} new students, skipped ${skipped} existing`)
  console.log('Demo password for all: student123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
