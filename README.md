# Attendly — Student Attendance System

A web-based Student Attendance System built with Next.js 16, TypeScript, Prisma, and Tailwind CSS.

## Features

- **Dual authentication**: Admin + Student login with BCrypt password hashing
- **Student Management**: CRUD with search (roll number, name, branch, section, semester)
- **Subject Management**: CRUD (code, name, branch, semester)
- **Manual Attendance Marking**: Per-student Present/Absent toggle, unique per student+subject+date
- **QR Attendance**: Admin generates expiring QR session → student scans + verifies face → attendance marked
- **One-Device-per-Student**: Device binding enforced (admin-controlled register/unbind)
- **Reports**: Student-wise + Subject-wise with 75% threshold highlighting
- **Low Attendance Alerts**: Students below 75% with subject-level breakdowns
- **Study Resources**: Free study materials per subject (CRUD)
- **Security**: Audit logs, failed login tracking, rate limiting, password strength validation

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite dev / MySQL prod)
- **Auth**: BCrypt + in-memory session store with 8h sliding expiry
- **Charts**: Recharts
- **QR**: qrcode + html5-qrcode

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (package manager)

### Installation

```bash
# Install dependencies
bun install

# Set up database
cp .env.example .env
bun run db:push

# Seed demo data (admin + students + subjects + attendance history)
bun run scripts/seed.ts

# Start dev server
bun run dev
```

### Demo Credentials

- **Admin**: `admin` / `admin123`
- **Student**: `CSE21001` / `student123`

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Single-page orchestrator (login → admin/student)
│   ├── layout.tsx
│   ├── globals.css           # Custom emerald/teal theme
│   └── api/                   # 25+ API routes
│       ├── auth/              # admin-login, student-login, logout, me
│       ├── students/          # CRUD + device management
│       ├── subjects/          # CRUD
│       ├── attendance/        # mark + daily view
│       ├── qr-attendance/     # generate, active, verify-face
│       ├── resources/          # CRUD
│       ├── reports/           # student, subject, low-attendance
│       ├── dashboard/         # stats
│       └── security/          # overview
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── sas/                   # App components
│       ├── login-screen.tsx
│       ├── admin-app.tsx
│       ├── student-app.tsx
│       ├── views/             # Admin views (10)
│       └── student/           # Student views (5)
├── lib/
│   ├── auth.ts               # BCrypt + session management
│   ├── db.ts                 # Prisma client
│   ├── security.ts           # Rate limiting, sanitization, audit logging
│   └── client/
│       └── api.ts            # Fetch wrapper
├── store/
│   └── app-store.ts          # Zustand store
└── proxy.ts                  # Security headers middleware
prisma/
└── schema.prisma             # 10 models
scripts/
├── seed.ts                   # Demo data seeding
└── add-demo-students.ts      # Idempotent student seeding
```

## License

This project is for educational purposes.
