import { db } from '../src/lib/db'

async function main() {
  const topics = [
    { title: 'Library Management System', description: 'JavaFX/Swing GUI for managing book issues, returns, fines, and member records with JDBC + MySQL.', category: 'GUI' },
    { title: 'Hospital Management System', description: 'Desktop GUI for patient registration, doctor scheduling, billing, and pharmacy inventory.', category: 'GUI' },
    { title: 'School Management System', description: 'Student/teacher attendance, marks, timetable, and report card generation with GUI.', category: 'GUI' },
    { title: 'Bank Account Management System', description: 'JavaFX GUI simulating account creation, deposits, withdrawals, transfers, and statements.', category: 'GUI' },
    { title: 'Electricity Billing System', description: 'Customer, meter reading, bill calculation, and payment tracking with a Swing GUI.', category: 'GUI' },
    { title: 'Inventory Management System', description: 'Stock in/out, supplier management, reorder alerts, and reports via JavaFX + JDBC.', category: 'GUI' },
    { title: 'Movie Ticket Booking System', description: 'Seat selection, show timing, payment simulation, and booking history GUI.', category: 'GUI' },
    { title: 'Recipe Manager', description: 'Add, search, favorite recipes with ingredient scaling and nutrition lookup GUI.', category: 'GUI' },
    { title: 'Personal Finance Tracker', description: 'Income/expense categories, monthly budgets, charts, and savings goals GUI.', category: 'GUI' },
    { title: 'Student Grade Book', description: 'Subject-wise marks entry, GPA calculation, ranking, and printable report GUI.', category: 'GUI' },
    { title: 'Hotel Reservation System', description: 'Room availability, booking, check-in/out, billing, and guest history GUI.', category: 'GUI' },
    { title: 'Airline Reservation System', description: 'Flight search, seat map, booking, cancellation, and itinerary GUI.', category: 'GUI' },
    { title: 'Employee Payroll System', description: 'Salary structure, leave, overtime, tax computation, and payslip generation GUI.', category: 'GUI' },
    { title: 'Railway Ticket Booking System', description: 'Train search, class selection, PNR generation, and ticket cancellation GUI.', category: 'GUI' },
    { title: 'Petrol Pump Management System', description: 'Fuel inventory, daily sales, customer billing, and shift reconciliation GUI.', category: 'GUI' },
    { title: 'Online Examination Portal', description: 'Spring Boot web app for timed MCQ exams, auto-evaluation, and result dashboard.', category: 'Web' },
    { title: 'E-commerce Shopping Site', description: 'Product catalog, cart, checkout, order tracking, and admin inventory web app.', category: 'Web' },
    { title: 'Online Job Portal', description: 'Job posts, applicant profiles, resume upload, application tracking, and recruiter dashboard.', category: 'Web' },
    { title: 'Online Blood Donation Portal', description: 'Donor registration, blood bank inventory, request matching, and SMS alerts.', category: 'Web' },
    { title: 'Blogging Platform', description: 'Spring + Thymeleaf blog with rich-text editor, comments, categories, and RSS feed.', category: 'Web' },
    { title: 'Online Learning Platform', description: 'Course catalog, video lectures, quizzes, progress tracking, and certificates.', category: 'Web' },
    { title: 'Healthcare Appointment System', description: 'Doctor search, slot booking, video consultation link, and prescription upload web app.', category: 'Web' },
    { title: 'Cab Booking System', description: 'Real-time driver tracking, fare estimation, ride history, and driver payouts web app.', category: 'Web' },
    { title: 'Property Rental Portal', description: 'Property listings, virtual tour, owner-tenant chat, lease agreements, and rent payment.', category: 'Web' },
    { title: 'Crowdfunding Platform', description: 'Campaign creation, milestone-based funding, donor wall, and progress tracking.', category: 'Web' },
    { title: 'Social Media Analytics Dashboard', description: 'Connect Twitter/Reddit APIs, fetch metrics, render charts, and export reports.', category: 'Web' },
    { title: 'Food Delivery Web App', description: 'Restaurant search, menu, cart, live order tracking, delivery partner dashboard.', category: 'Web' },
    { title: 'Event Management System', description: 'Event creation, ticket tiers, RSVP, QR check-in, and post-event feedback web app.', category: 'Web' },
    { title: 'Online Pharmacy Store', description: 'Medicine catalog, prescription upload, pharmacist verification, and delivery tracking.', category: 'Web' },
    { title: 'Alumni Network Portal', description: 'Alumni profiles, job referrals, donations, reunions, and mentorship matchmaking web app.', category: 'Web' },
    { title: 'ATM Simulation System', description: 'Console/GUI ATM sim with card auth, PIN change, withdrawal, balance, and mini-statement using JDBC.', category: 'Database' },
    { title: 'Railway Enquiry System', description: 'Train between stations, PNR status, fare inquiry — backed by a normalized railway schema.', category: 'Database' },
    { title: 'Pharmacy Stock Management', description: 'Drug master, batch/expiry tracking, supplier orders, low-stock alerts via JDBC.', category: 'Database' },
    { title: 'University Result Publishing System', description: 'Subject-wise marks entry, GPA, rank list, and published result PDFs backed by relational schema.', category: 'Database' },
    { title: 'Insurance Management System', description: 'Policy master, premium schedule, claim filing, agent commission, and customer ledger.', category: 'Database' },
    { title: 'Cable TV Subscriber Management', description: 'Subscriber master, plan catalog, monthly billing, payment tracking, and disconnection workflow.', category: 'Database' },
    { title: 'Courier Tracking System', description: 'Consignment booking, tracking ID, branch handoff, delivery status, and POD scanning.', category: 'Database' },
    { title: 'Library Book Movement Tracker', description: 'Book master, issue/return transactions, fine calculation, and overdue reminder reports.', category: 'Database' },
    { title: 'Employee Attendance Logger', description: 'Daily punch in/out, leave ledger, monthly attendance register, and absentee reports.', category: 'Database' },
    { title: 'Vehicle Service Center Management', description: 'Job cards, spare parts consumption, mechanic allocation, invoice, and service history.', category: 'Database' },
    { title: 'Chat Server using Sockets', description: 'Multi-client chat with TCP sockets, group rooms, file transfer, and presence notifications.', category: 'Network' },
    { title: 'File Transfer over FTP', description: 'Java FTP server + client with auth, resumable uploads, directory listing, and progress bar.', category: 'Network' },
    { title: 'HTTP Server from Scratch', description: 'Minimal HTTP/1.1 server in Java handling GET/POST, static files, MIME types, and keep-alive.', category: 'Network' },
    { title: 'Network Packet Sniffer', description: 'Java Pcap-based sniffer showing source/dest IPs, ports, protocol breakdown, and packet counts.', category: 'Network' },
    { title: 'DNS Lookup Tool', description: 'Command-line + GUI tool for A, MX, TXT, CNAME lookups with caching and TTL display.', category: 'Network' },
    { title: 'Port Scanner', description: 'Multi-threaded TCP port scanner with service banner grabbing and concurrent scanning.', category: 'Network' },
    { title: 'Remote Method Invocation (RMI) Calculator', description: 'Java RMI server exposing arithmetic operations + remote client with GUI.', category: 'Network' },
    { title: 'P2P File Sharing System', description: 'Tracker + peer model with chunked downloads, peer discovery, and integrity verification.', category: 'Network' },
    { title: 'Spam Email Classifier', description: 'Java + Weka/Deeplearning4j Naive Bayes model trained on Enron dataset with TF-IDF features.', category: 'AI/ML' },
    { title: 'Handwritten Digit Recognizer', description: 'MNIST classifier using Deeplearning4j with CNN, GUI canvas for live prediction.', category: 'AI/ML' },
    { title: 'Sentiment Analyzer for Reviews', description: 'Java app fetching product reviews, classifying pos/neg using Lexicon + ML hybrid.', category: 'AI/ML' },
    { title: 'Chatbot for College Enquiry', description: 'Rule-based + retrieval-based Java chatbot answering FAQs about admissions and courses.', category: 'AI/ML' },
    { title: 'Plagiarism Detector', description: 'N-gram + Jaccard similarity over document corpus, with highlighted matches GUI.', category: 'AI/ML' },
    { title: 'Face Detection Attendance', description: 'JavaCV/OpenCV face detection on webcam feed, matched against student photo DB for attendance.', category: 'AI/ML' },
    { title: 'Weather Forecast Predictor', description: 'Time-series model over historical weather data with GUI showing predicted vs actual.', category: 'AI/ML' },
    { title: 'Resume Parser & Ranker', description: 'Extract skills/edu from PDFs using regex + Stanford NLP, rank against a job description.', category: 'AI/ML' },
    { title: 'Snake Game (JavaFX)', description: 'Classic snake with score, levels, speed control, sound effects, and high-score leaderboard.', category: 'Game' },
    { title: 'Tetris Clone', description: 'Full Tetris with 7 tetrominoes, line clear, scoring, ghost piece, and increasing difficulty.', category: 'Game' },
    { title: 'Chess with AI Opponent', description: 'Two-player + AI using minimax with alpha-beta pruning, move validator, and GUI board.', category: 'Game' },
    { title: 'Sudoku Generator & Solver', description: 'Puzzle generator with difficulty levels + backtracking solver and GUI.', category: 'Game' },
    { title: 'Minesweeper', description: 'Classic minesweeper with timer, flag mode, custom grid sizes, and high-score persistence.', category: 'Game' },
    { title: 'Pac-Man Clone', description: 'Pac-Man with 4 ghost AIs (chase, scatter, frightened modes), score, and lives system.', category: 'Game' },
    { title: 'Car Racing Game', description: 'Top-down racer with obstacle spawn, collision, lap timing, and HUD with speedometer.', category: 'Game' },
    { title: 'Memory Match Game', description: 'Card-flip memory game with image themes, timer, moves count, and best-score leaderboard.', category: 'Game' },
    { title: 'Currency Converter (Real-time)', description: 'Java app fetching live rates from a public API, with multi-currency conversion and history.', category: 'General' },
    { title: 'Weather Forecast App', description: 'GUI + REST client fetching OpenWeather API, with 5-day forecast and city search.', category: 'General' },
    { title: 'PDF Merger & Splitter', description: 'Java utility using Apache PDFBox for merging, splitting, and rotating PDFs with CLI + GUI.', category: 'General' },
    { title: 'Image Resizer & Watermark', description: 'Batch processor using Java image I/O — resize, watermark, format conversion.', category: 'General' },
    { title: 'Password Manager', description: 'AES-encrypted vault for credentials, with master password, generator, and clipboard auto-clear.', category: 'General' },
    { title: 'Task Tracker with Reminders', description: 'JavaFX to-do app with categories, due dates, system tray reminders, and CSV export.', category: 'General' },
  ]
  let added = 0
  for (const t of topics) {
    const exists = await db.presetTopic.findFirst({ where: { title: t.title } })
    if (exists) continue
    await db.presetTopic.create({ data: t })
    added++
  }
  console.log(`Seeded ${added} preset topics. Total: ${await db.presetTopic.count()}`)

  // Create demo team if students exist
  const admin = await db.admin.findFirst()
  const students = await db.student.findMany({ take: 4, orderBy: { studentId: 'asc' } })
  if (admin && students.length >= 4 && (await db.team.count()) === 0) {
    const team = await db.team.create({ data: { teamName: 'CodeBusters', facultyMentorId: admin.id, status: 'finalized', finalizedAt: new Date() } })
    await db.teamMember.create({ data: { teamId: team.id, studentId: students[0].id, role: 'Leader' } })
    for (let i = 1; i < 4; i++) await db.teamMember.create({ data: { teamId: team.id, studentId: students[i].id, role: 'Member' } })
    console.log(`Created demo team "CodeBusters" with 4 members`)
  }

  // Create 2 demo live sessions
  if ((await db.liveSession.count()) === 0) {
    const now = new Date()
    const nextSunday = new Date(now); nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7)); nextSunday.setHours(10, 0, 0, 0)
    const nextMonday = new Date(nextSunday); nextMonday.setDate(nextSunday.getDate() + 1)
    await db.liveSession.create({ data: { title: 'Java Project — Phase 1: Setup & Architecture', sessionDate: nextSunday, dayOfWeek: 'Sunday', startTime: '10:00', endTime: '12:00', meetingUrl: 'https://meet.google.com/abc-defg-hij' } })
    await db.liveSession.create({ data: { title: 'Java Project — OOP Design & Class Diagrams', sessionDate: nextMonday, dayOfWeek: 'Monday', startTime: '16:00', endTime: '18:00', meetingUrl: 'https://meet.google.com/xyz-wxyz-pqr' } })
    console.log('Seeded 2 live sessions')
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
