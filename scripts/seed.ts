import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  // Admin user
  const admin = await db.admin.create({
    data: {
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      name: 'System Administrator',
      role: 'admin',
    },
  })
  console.log('Created admin:', admin.username)

  // Subjects
  const subjects = await Promise.all(
    [
      { code: 'CS301', name: 'Data Structures & Algorithms', branch: 'CSE', semester: 3 },
      { code: 'CS302', name: 'Operating Systems', branch: 'CSE', semester: 3 },
      { code: 'CS303', name: 'Database Management Systems', branch: 'CSE', semester: 3 },
      { code: 'CS304', name: 'Computer Networks', branch: 'CSE', semester: 3 },
      { code: 'MA301', name: 'Engineering Mathematics III', branch: 'CSE', semester: 3 },
      { code: 'EC301', name: 'Digital Electronics', branch: 'ECE', semester: 3 },
    ].map((s) => db.subject.create({ data: { ...s, totalClasses: 0 } })),
  )
  console.log('Created', subjects.length, 'subjects')

  // Students
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

  const students = await Promise.all(
    studentsData.map((s) =>
      db.student.create({
        data: {
          ...s,
          passwordHash: hashPassword('student123'),
          passwordPlain: 'student123',
          fingerprintEnrolled: Math.random() > 0.5,
        },
      }),
    ),
  )
  console.log('Created', students.length, 'students')

  // Generate past attendance (last 30 days, mark ~5 classes per subject per week)
  const now = new Date()
  for (let daysAgo = 30; daysAgo >= 1; daysAgo--) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(9, 0, 0, 0)
    // Skip weekends
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue

    // For each CSE subject, mark attendance for CSE students
    for (const subj of subjects.filter((s) => s.branch === 'CSE')) {
      // 70% chance a class was held that day
      if (Math.random() > 0.7) continue

      for (const stu of students.filter((s) => s.branch === 'CSE')) {
        // Each student has 80% chance to be present normally, but a couple of students have low attendance
        const presentRate = stu.studentId === 'CSE21004' || stu.studentId === 'CSE21006' ? 0.5 : 0.85
        const status = Math.random() < presentRate ? 'Present' : 'Absent'

        await db.attendance.create({
          data: {
            studentId: stu.id,
            subjectId: subj.id,
            date,
            status,
            markedBy: admin.id,
            markedVia: 'manual',
          },
        }).catch(() => null) // skip duplicates
      }
    }
    // ECE subjects + ECE students
    for (const subj of subjects.filter((s) => s.branch === 'ECE')) {
      if (Math.random() > 0.7) continue
      for (const stu of students.filter((s) => s.branch === 'ECE')) {
        const status = Math.random() < 0.85 ? 'Present' : 'Absent'
        await db.attendance.create({
          data: {
            studentId: stu.id,
            subjectId: subj.id,
            date,
            status,
            markedBy: admin.id,
            markedVia: 'manual',
          },
        }).catch(() => null)
      }
    }
  }

  // Update totalClasses for each subject = count of distinct dates attendance was marked
  for (const subj of subjects) {
    const distinctDates = await db.attendance.findMany({
      where: { subjectId: subj.id },
      select: { date: true },
      distinct: ['date'],
    })
    await db.subject.update({
      where: { id: subj.id },
      data: { totalClasses: distinctDates.length },
    })
  }

  console.log('Seed completed successfully!')
  console.log('---')
  console.log('Admin login:   username=admin  password=admin123')
  console.log('Student login:  studentId=CSE21001  password=student123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
