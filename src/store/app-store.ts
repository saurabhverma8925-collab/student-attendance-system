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

  adminView:
    | 'dashboard'
    | 'students'
    | 'attendance'
    | 'qr-attendance'
    | 'resources'
    | 'reports'
    | 'low-attendance'
    | 'subjects'
    | 'security'
  setAdminView: (v: AppState['adminView']) => void

  studentView: 'home' | 'subjects' | 'device' | 'resources' | 'qr-attendance'
  setStudentView: (v: AppState['studentView']) => void

  // Set to true when student just logged in and hasn't seen onboarding screen yet
  showOnboarding: boolean
  setShowOnboarding: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  adminView: 'dashboard',
  setAdminView: (v) => set({ adminView: v }),
  studentView: 'home',
  setStudentView: (v) => set({ studentView: v }),
  showOnboarding: false,
  setShowOnboarding: (v) => set({ showOnboarding: v }),
}))
