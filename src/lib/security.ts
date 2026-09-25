import crypto from 'crypto'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'

// ============================================================================
// 1. CRYPTOGRAPHICALLY SECURE TOKEN GENERATION
//    Replaces Math.random() which is NOT cryptographically secure.
// ============================================================================

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

// ============================================================================
// 2. INPUT SANITIZATION & VALIDATION
//    Prevents stored XSS, oversized payloads, and bad data.
// ============================================================================

const MAX_STRING_LENGTH = 1000

/**
 * Sanitize a string input: trim whitespace, collapse runs of whitespace,
 * enforce a max length, and strip control characters. Does NOT escape HTML
 * (that's the responsibility of the rendering layer — React escapes by default).
 */
export function sanitizeString(input: unknown, maxLen = MAX_STRING_LENGTH): string {
  if (typeof input !== 'string') return ''
  // Strip control chars (including null bytes) and normalize whitespace
  const cleaned = input
    .replace(/[\x00-\x1F\x7F]/g, '') // control chars
    .replace(/\s+/g, ' ') // collapse whitespace runs
    .trim()
  return cleaned.slice(0, maxLen)
}

export function validateEmail(email: string): boolean {
  // Simple, conservative email regex — RFC 5322 is too permissive
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  // Allow +, digits, spaces, dashes, parens. Length 7-20.
  return /^[+()\d][\d\s()-]{5,19}$/.test(phone) && phone.replace(/\D/g, '').length >= 7
}

export function validateStudentId(id: string): boolean {
  // Alphanumeric + dash, 3-30 chars
  return /^[A-Za-z0-9][A-Za-z0-9-]{2,29}$/.test(id)
}

/**
 * Validate password strength. Returns null if OK, else a friendly reason string.
 * Policy: min 8 chars, must contain at least one letter and one digit.
 * For admin passwords we additionally require mixed case.
 */
export function validatePasswordStrength(
  password: string,
  opts: { requireMixedCase?: boolean; minLength?: number } = {},
): string | null {
  const minLen = opts.minLength ?? 8
  if (!password) return 'Password is required'
  if (password.length < minLen) return `Password must be at least ${minLen} characters`
  if (password.length > 200) return 'Password is too long'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password must contain both letters and digits'
  }
  if (opts.requireMixedCase) {
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      return 'Password must contain both uppercase and lowercase letters'
    }
  }
  // Block the most common weak passwords
  const weak = ['password', 'password1', 'password123', 'admin123', '12345678', 'qwerty12']
  if (weak.includes(password.toLowerCase())) {
    return 'This password is too common — choose something unique'
  }
  return null
}

// ============================================================================
// 3. RATE LIMITING (in-memory sliding window)
//    Protects auth endpoints from brute-force attacks.
// ============================================================================

interface RateLimitEntry {
  count: number
  firstAttemptAt: number
  blockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const globalRateStore = (globalThis as any).__rateLimitStore ?? rateLimitStore
;(globalThis as any).__rateLimitStore = globalRateStore

export interface RateLimitConfig {
  // Max number of attempts allowed in the window
  maxAttempts: number
  // Window size in milliseconds
  windowMs: number
  // Block duration after exceeding the limit (milliseconds)
  blockMs: number
}

export const DEFAULT_AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 60 * 1000, // 1 minute
  blockMs: 5 * 60 * 1000, // 5 minutes
}

export const QR_VERIFY_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 30,
  windowMs: 60 * 1000,
  blockMs: 2 * 60 * 1000,
}

/**
 * Check rate limit for a key (usually IP + endpoint). Returns null if allowed,
 * or an object with `retryAfterSec` if blocked.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): { retryAfterSec: number } | null {
  const now = Date.now()
  const entry = globalRateStore.get(key)

  // If blocked, return retry-after
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    return { retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000) }
  }

  // If no entry or window expired, start fresh
  if (!entry || now - entry.firstAttemptAt > config.windowMs) {
    globalRateStore.set(key, { count: 1, firstAttemptAt: now })
    return null
  }

  // Increment count
  entry.count++

  // If exceeded, block
  if (entry.count > config.maxAttempts) {
    entry.blockedUntil = now + config.blockMs
    globalRateStore.set(key, entry)
    return { retryAfterSec: Math.ceil(config.blockMs / 1000) }
  }

  return null
}

// Decay: periodically clean up old entries to prevent memory bloat
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of globalRateStore.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      globalRateStore.delete(key)
    } else if (!entry.blockedUntil && now - entry.firstAttemptAt > 10 * 60 * 1000) {
      globalRateStore.delete(key)
    }
  }
}, 60 * 1000).unref()

// ============================================================================
// 4. AUDIT LOGGING — record sensitive actions for security forensics
// ============================================================================

export async function audit(params: {
  actorId: string
  actorRole: 'admin' | 'student' | 'system'
  action: string
  target?: string | null
  ip?: string | null
  userAgent?: string | null
  details?: Record<string, any> | null
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        target: params.target ?? null,
        ip: params.ip ?? null,
        userAgent: params.userAgent ? String(params.userAgent).slice(0, 500) : null,
        details: params.details ? JSON.stringify(params.details).slice(0, 2000) : null,
      },
    })
  } catch (e) {
    // Audit logging should never break the request — just log
    console.warn('audit log failed:', e)
  }
}

export async function logFailedLogin(params: {
  username: string
  role: 'admin' | 'student'
  ip?: string | null
  userAgent?: string | null
}) {
  try {
    await db.failedLoginAttempt.create({
      data: {
        username: String(params.username).slice(0, 100),
        role: params.role,
        ip: params.ip ?? null,
        userAgent: params.userAgent ? String(params.userAgent).slice(0, 500) : null,
      },
    })
  } catch (e) {
    console.warn('failed login log failed:', e)
  }
}

// ============================================================================
// 5. CLIENT IP EXTRACTION — for rate limiting & audit logs
// ============================================================================

export function getClientIp(req: NextRequest): string | null {
  // Trust X-Forwarded-For only the first IP (closest to the client)
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0].trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return null
}

export function getClientUa(req: NextRequest): string | null {
  return req.headers.get('user-agent')
}

// Combined rate-limit key (IP + endpoint)
export function rateLimitKey(req: NextRequest, endpoint: string): string {
  const ip = getClientIp(req) || 'unknown'
  return `${ip}:${endpoint}`
}
