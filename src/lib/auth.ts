import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const SESSION_KEY = 'sas_session'

export type SessionUser =
  | { role: 'admin'; id: string; username: string; name: string }
  | { role: 'student'; id: string; studentId: string; name: string }

export function hashPassword(p: string) {
  return bcrypt.hashSync(p, 10)
}

export function verifyPassword(p: string, hash: string) {
  return bcrypt.compareSync(p, hash)
}

// Simple in-memory session store keyed by token (good enough for demo)
const sessions = new Map<string, SessionUser>()

export function createSession(user: SessionUser) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  sessions.set(token, user)
  return token
}

export function getSession(token?: string): SessionUser | null {
  if (!token) return null
  return sessions.get(token) ?? null
}

export function destroySession(token: string) {
  sessions.delete(token)
}

export const SESSION_COOKIE = SESSION_KEY
