import { db } from '../src/lib/db'

// Backfill passwordPlain for existing students whose plain password is unknown.
// Set them all to 'student123' since that's the demo default.
async function main() {
  const students = await db.student.findMany()
  let updated = 0
  for (const s of students) {
    if (!s.passwordPlain) {
      await db.student.update({
        where: { id: s.id },
        data: { passwordPlain: 'student123' },
      })
      updated++
    }
  }
  console.log(`Backfilled ${updated} of ${students.length} students with passwordPlain='student123'`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
