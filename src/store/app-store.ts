'use client'

import { create } from 'zustand'

export type Role = 'admin' | 'student' | null

export interface SessionUser {
  id: string
  name: string
  role: Role
  username?: string
  studentId?: string
  branch?: string
  section?: string
  semester?: number
  deviceFingerprint?: string | null
  hasSeenOnboarding?: boolean
}

interface AppState {
  user: SessionUser | null
  setUser: (u: SessionUser | null) => void
  adminView: 'java-dashboard' | 'teams' | 'topics' | 'review-submissions' | 'live-sessions' | 'students' | 'security'
  setAdminView: (v: AppState['adminView']) => void
  studentView: 'my-team' | 'topic-selection' | 'my-reviews' | 'live-sessions'
  setStudentView: (v: AppState['studentView']) => void
  showOnboarding: boolean
  setShowOnboarding: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  adminView: 'java-dashboard',
  setAdminView: (v) => set({ adminView: v }),
  studentView: 'my-team',
  setStudentView: (v) => set({ studentView: v }),
  showOnboarding: false,
  setShowOnboarding: (v) => set({ showOnboarding: v }),
}))
