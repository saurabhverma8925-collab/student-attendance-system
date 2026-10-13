// ============================================================================
// Java Project Submission Portal — domain logic for reviews, rubrics, dates
// ============================================================================

// Key deadlines from the project guidelines (hardcoded per the rules)
export const REVIEW_DEADLINES = {
  R0_OPENS: new Date('2026-09-15T00:00:00Z'),  // To be announced on portal; we set 15 Sept
  R1_OPENS: new Date('2026-09-01T00:00:00Z'),  // Day 1 of project board
  R1_CLOSES: new Date('2026-10-10T23:59:59Z'), // Saturday, 10 October 2026
  R2_OPENS: new Date('2026-10-11T00:00:00Z'),  // Opens after R1 deadline
  R2_CLOSES: new Date('2026-11-15T23:59:59Z'), // Sunday, 15 November 2026
  TEAM_FINALIZATION: new Date('2026-09-15T23:59:59Z'), // 15 Sept 2026
}

export const REVIEW_MARKS = {
  R0: 0,
  R1: 33,
  R2: 17,
}

// Team size rules
export const TEAM_SIZE = { MIN: 3, MAX: 4 }

// ============================================================================
// REVIEW UNLOCK LOGIC — checks whether a team can submit each review
// ============================================================================

export interface TeamReviewStatus {
  hasR0: boolean
  r0Approved: boolean
  hasR1: boolean
  hasR2: boolean
}

/**
 * Determine if a team can submit a given review.
 * - R0: team must be finalized
 * - R1: R0 must be approved by faculty
 * - R2: R1 must be submitted AND current date must be >= R2_OPENS
 */
export function canSubmitReview(
  reviewNumber: 0 | 1 | 2,
  status: TeamReviewStatus,
  now: Date = new Date(),
): { allowed: boolean; reason?: string } {
  if (reviewNumber === 0) {
    return { allowed: true }
  }
  if (reviewNumber === 1) {
    if (!status.hasR0) return { allowed: false, reason: 'Submit Review 0 first' }
    if (!status.r0Approved) return { allowed: false, reason: 'Review 0 must be approved by faculty' }
    if (now > REVIEW_DEADLINES.R1_CLOSES) return { allowed: false, reason: 'Review 1 deadline (10 Oct 2026) has passed' }
    return { allowed: true }
  }
  if (reviewNumber === 2) {
    if (!status.hasR1) return { allowed: false, reason: 'Submit Review 1 first' }
    if (now < REVIEW_DEADLINES.R2_OPENS) return { allowed: false, reason: 'Review 2 opens on 11 Oct 2026 (after R1 deadline)' }
    if (now > REVIEW_DEADLINES.R2_CLOSES) return { allowed: false, reason: 'Review 2 deadline (15 Nov 2026) has passed' }
    return { allowed: true }
  }
  return { allowed: false, reason: 'Invalid review number' }
}

// ============================================================================
// MARKING RUBRICS — per the official Java Programming Project Submission
// Guidelines (faculty-circulated).
//
// Review 1 totals 33 marks for both Rubric A (GUI) and Rubric B (Web).
// Review 2 totals 17 marks — criteria not yet specified in the guidelines
// document; we use sensible placeholders marked as "TBD".
// ============================================================================

export interface RubricCriterion {
  name: string
  maxMarks: number
  description: string
}

// === RUBRIC A — GUI-BASED PROJECTS (Review 1, 33 marks) ===
// Official criteria from the guidelines document.
// Totals: 10 + 6 + 4 + 7 + 3 + 3 = 33 ✓
export const RUBRIC_A_R1: RubricCriterion[] = [
  {
    name: 'OOP Implementation (Polymorphism, Inheritance, Exception Handling, Interfaces)',
    maxMarks: 10,
    description: 'Proper use of polymorphism, inheritance, exception handling, and interfaces throughout the project.',
  },
  {
    name: 'Collections & Generics',
    maxMarks: 6,
    description: 'Effective use of Java Collections Framework (List, Set, Map, etc.) and generics for type safety.',
  },
  {
    name: 'Multithreading & Synchronization',
    maxMarks: 4,
    description: 'Proper use of threads, synchronization, and concurrent execution where applicable.',
  },
  {
    name: 'Classes for the Database Operations',
    maxMarks: 7,
    description: 'Well-designed DAO/Repository classes for CRUD operations, separation of concerns.',
  },
  {
    name: 'Database Connectivity (JDBC)',
    maxMarks: 3,
    description: 'Correct JDBC setup, connection management, prepared statements, resource cleanup.',
  },
  {
    name: 'Implement JDBC for Database Connectivity',
    maxMarks: 3,
    description: 'Actual JDBC implementation working end-to-end (CRUD operations against a real DB).',
  },
]

// === RUBRIC B — WEB-BASED PROJECTS (Review 1, 33 marks) ===
// Official criteria from the guidelines document.
// Totals: 8 + 10 + 8 + 7 = 33 ✓
export const RUBRIC_B_R1: RubricCriterion[] = [
  {
    name: 'Problem Understanding & Solution Design',
    maxMarks: 8,
    description: 'Clear understanding of the problem, well-architected solution, sensible module/service boundaries.',
  },
  {
    name: 'Core Java Concepts',
    maxMarks: 10,
    description: 'Proper use of OOP, collections, generics, exception handling, multithreading where applicable.',
  },
  {
    name: 'Database Integration (JDBC)',
    maxMarks: 8,
    description: 'Correct JDBC setup, DAO layer, prepared statements, transaction handling, schema design.',
  },
  {
    name: 'Servlets & Web Integration',
    maxMarks: 7,
    description: 'Proper use of Servlets/JSP/Spring controllers, request handling, session management, MVC structure.',
  },
]

// === REVIEW 2 (17 marks) — criteria not yet specified in the guidelines ===
// These are placeholders. Faculty should update them when official R2 criteria
// are circulated.
export const RUBRIC_A_R2: RubricCriterion[] = [
  { name: 'Final Functionality', maxMarks: 6, description: 'Working features, edge cases handled [TBD — not in guidelines]' },
  { name: 'Code Quality & Refactoring', maxMarks: 4, description: 'Naming, modularity, SOLID, design patterns [TBD]' },
  { name: 'Testing', maxMarks: 3, description: 'JUnit tests, coverage, edge cases [TBD]' },
  { name: 'Final Report', maxMarks: 2, description: 'Comprehensive report with UML, screenshots [TBD]' },
  { name: 'Viva / Q&A', maxMarks: 2, description: 'Conceptual clarity in defense [TBD]' },
]

export const RUBRIC_B_R2: RubricCriterion[] = [
  { name: 'Final Functionality', maxMarks: 6, description: 'Working features, end-to-end flows [TBD — not in guidelines]' },
  { name: 'Code Quality & Performance', maxMarks: 4, description: 'Naming, modularity, query optimization, caching [TBD]' },
  { name: 'Testing & Deployment', maxMarks: 3, description: 'Unit/integration tests, CI/CD, containerization [TBD]' },
  { name: 'Final Report', maxMarks: 2, description: 'Comprehensive report with architecture, screenshots [TBD]' },
  { name: 'Viva / Q&A', maxMarks: 2, description: 'Conceptual clarity in defense [TBD]' },
]

export function getRubric(rubricType: 'A' | 'B', reviewNumber: 1 | 2): RubricCriterion[] {
  if (reviewNumber === 1) return rubricType === 'A' ? RUBRIC_A_R1 : RUBRIC_B_R1
  return rubricType === 'A' ? RUBRIC_A_R2 : RUBRIC_B_R2
}

export function rubricTotal(rubricType: 'A' | 'B', reviewNumber: 1 | 2): number {
  return getRubric(rubricType, reviewNumber).reduce((sum, c) => sum + c.maxMarks, 0)
}

// ============================================================================
// HELPER: format review status as human-readable label
// ============================================================================

export function reviewStatusLabel(submission: {
  status: string
  marksAwarded: number | null
  reviewNumber: number
}): string {
  if (submission.status === 'approved') return 'Approved'
  if (submission.status === 'rejected') return 'Rejected — resubmit'
  return 'Pending faculty review'
}
