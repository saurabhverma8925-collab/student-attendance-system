import { db } from '../src/lib/db'

// Seed free study resources for each subject (idempotent)
async function main() {
  const subjects = await db.subject.findMany()
  if (subjects.length === 0) {
    console.log('No subjects found. Run add-demo-students.ts first.')
    return
  }

  // Default free resources per subject code (real, publicly available)
  const defaults: Record<string, { title: string; type: string; url: string; description: string }[]> = {
    CS301: [
      { title: 'NPTEL: Data Structures And Algorithms', type: 'course', url: 'https://nptel.ac.in/courses/106/106/106106145/', description: 'Free 8-week course by IIT Bombay with video lectures + assignments.' },
      { title: 'VisuAlgo.net — Algorithm Visualizer', type: 'tool', url: 'https://visualgo.net/', description: 'Interactive visualizations of all classic algorithms.' },
      { title: 'GeeksforGeeks — DSA Tutorial', type: 'article', url: 'https://www.geeksforgeeks.org/data-structures/', description: 'Free comprehensive article-based tutorials with practice problems.' },
      { title: 'Free PDF: Algorithm Design Manual (Skeina)', type: 'book', url: 'https://www8.cs.umu.se/kurser/TDBAfl/VT06/algoritmer/LEKTIONER/Algorithm_Design_Manual_Skeina.pdf', description: 'Classic textbook available as a free PDF.' },
    ],
    CS302: [
      { title: 'NPTEL: Operating Systems', type: 'course', url: 'https://nptel.ac.in/courses/106/106/106106144/', description: 'Free course by IIT Madras covering process scheduling, memory, file systems.' },
      { title: 'OSTEP (Operating Systems: Three Easy Pieces)', type: 'book', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', description: 'Free online textbook used in many universities.' },
      { title: 'OSDev Wiki', type: 'article', url: 'https://wiki.osdev.org/', description: 'Community-driven encyclopedia on OS internals.' },
    ],
    CS303: [
      { title: 'NPTEL: Database Management System', type: 'course', url: 'https://nptel.ac.in/courses/106/105/106105175/', description: 'Free IIT course covering relational algebra, SQL, normalization, transactions.' },
      { title: 'SQLBolt — Interactive SQL Lessons', type: 'tool', url: 'https://sqlbolt.com/', description: 'Free interactive SQL tutorial in the browser.' },
      { title: 'Free PDF: Database System Concepts (Silberschatz)', type: 'book', url: 'https://db-book.com/', description: 'Standard textbook site with free chapter excerpts.' },
    ],
    CS304: [
      { title: 'NPTEL: Computer Networks', type: 'course', url: 'https://nptel.ac.in/courses/106/105/106105183/', description: 'Free IIT Kharagpur course on TCP/IP, routing, application layer.' },
      { title: 'Khan Academy: Internet Engineering', type: 'video', url: 'https://www.khanacademy.org/computing/code-org/computers-and-the-internet', description: 'Free video series on how the internet works.' },
    ],
    MA301: [
      { title: 'NPTEL: Engineering Mathematics III', type: 'course', url: 'https://nptel.ac.in/courses/111/106/111106139/', description: 'Free course covering Laplace transforms, complex variables, numerical methods.' },
      { title: 'Khan Academy: Multivariable Calculus', type: 'video', url: 'https://www.khanacademy.org/math/multivariable-calculus', description: 'Free video lessons with practice exercises.' },
      { title: 'Paul\'s Online Math Notes', type: 'article', url: 'https://tutorial.math.lamar.edu/', description: 'Free comprehensive math notes by a Lamar University professor.' },
    ],
    EC301: [
      { title: 'NPTEL: Digital Electronics', type: 'course', url: 'https://nptel.ac.in/courses/108/105/108105102/', description: 'Free course on logic gates, flip-flops, counters, ADC/DAC.' },
      { title: 'All About Circuits — Digital Electronics Textbook', type: 'book', url: 'https://www.allaboutcircuits.com/textbook/digital/', description: 'Free online textbook with interactive examples.' },
    ],
  }

  let added = 0
  for (const subj of subjects) {
    const list = defaults[subj.code] || []
    for (const r of list) {
      // Check by title+subjectId to make this idempotent
      const exists = await db.resource.findFirst({
        where: { subjectId: subj.id, title: r.title },
      })
      if (exists) continue
      await db.resource.create({
        data: {
          subjectId: subj.id,
          title: r.title,
          type: r.type,
          url: r.url,
          description: r.description,
          isFree: true,
        },
      })
      added++
    }
  }

  console.log(`Seeded ${added} free study resources across ${subjects.length} subjects`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
