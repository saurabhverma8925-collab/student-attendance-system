import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SESSION_KEY = 'sas_session'
// Sessions expire after 8 hours of inactivity (sliding window)
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000

export type SessionUser =
  | { role: 'admin'; id: string; username: string; name: string }
  | { role: 'student'; id: string; studentId: string; name: string }

interface SessionEntry {
  user: SessionUser
  createdAt: number
  lastAccessAt: number
}

export function hashPassword(p: string) {
  // Use cost factor 12 (default is 10) — adds ~60ms per hash but is meaningfully harder to brute-force
  return bcrypt.hashSync(p, 12)
}

export function verifyPassword(p: string, hash: string) {
  // bcrypt.compareSync is constant-time — safe against timing attacks
  return bcrypt.compareSync(p, hash)
}

// In-memory session store keyed by token. Use globalThis so the Map
// survives Next.js dev hot-reloads (otherwise every file change logs
// everyone out).
const globalForAuth = globalThis as unknown as {
  authSessions?: Map<string, SessionEntry>
}
const sessions: Map<string, SessionEntry> =
  globalForAuth.authSessions ?? new Map<string, SessionEntry>()
if (process.env.NODE_ENV !== 'production') globalForAuth.authSessions = sessions

// Periodically clean up expired sessions (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  const iv = setInterval(() => {
    const now = Date.now()
    for (const [token, entry] of sessions.entries()) {
      if (now - entry.lastAccessAt > SESSION_MAX_AGE_MS) {
        sessions.delete(token)
      }
    }
  }, 5 * 60 * 1000)
  // Don't keep the process alive just for this timer
  if (typeof iv.unref === 'function') iv.unref()
}

export function createSession(user: SessionUser): string {
  // CRYPTOGRAPHICALLY SECURE TOKEN — replaces Math.random() which was predictable
  const token = crypto.randomBytes(32).toString('hex')
  const now = Date.now()
  sessions.set(token, { user, createdAt: now, lastAccessAt: now })
  return token
}

export function getSession(token?: string): SessionUser | null {
  if (!token) return null
  const entry = sessions.get(token)
  if (!entry) return null

  // Sliding expiry — if too old, destroy and return null
  const now = Date.now()
  if (now - entry.lastAccessAt > SESSION_MAX_AGE_MS) {
    sessions.delete(token)
    return null
  }

  // Update last access time (sliding window)
  entry.lastAccessAt = now
  return entry.user
}

export function destroySession(token: string) {
  sessions.delete(token)
}

// Count currently active sessions — for the security dashboard
export function countActiveSessions(): number {
  const now = Date.now()
  let count = 0
  for (const [, entry] of sessions.entries()) {
    if (now - entry.lastAccessAt <= SESSION_MAX_AGE_MS) count++
  }
  return count
}

export const SESSION_COOKIE = SESSION_KEY

// Cookie options that should be used by every route that sets the session cookie
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true, // JS can't read the cookie — prevents XSS token theft
  sameSite: 'lax' as const, // CSRF protection (lax allows top-level nav links)
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
  path: '/',
  maxAge: 8 * 60 * 60, // 8 hours (matches session expiry)
}
