'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Fingerprint,
  Smartphone,
  LogOut,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Menu,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StudentDashboard } from './student/dashboard'
import { StudentBiometric } from './student/biometric'
import { StudentDevice } from './student/device'
import { StudentOnboarding } from './student/onboarding'

export function StudentApp() {
  const { user, setUser, studentView, setStudentView, showOnboarding, setShowOnboarding } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Show one-time onboarding if student hasn't seen it yet
  useEffect(() => {
    if (user?.role === 'student' && user.hasSeenOnboarding === false) {
      setShowOnboarding(true)
    } else {
      setShowOnboarding(false)
    }
  }, [user, setShowOnboarding])

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  // If onboarding should show, render it instead of the dashboard
  if (showOnboarding) {
    return <StudentOnboarding />
  }

  // Show onboarding prompts for fingerprint/device if not yet done
  const needsOnboarding =
    !user?.fingerprintEnrolled || !user?.deviceFingerprint

  const NAV = [
    { id: 'home', label: 'My Attendance', icon: LayoutDashboard },
    { id: 'biometric', label: 'Biometric Status', icon: Fingerprint },
    { id: 'device', label: 'Device Status', icon: Smartphone },
  ] as const

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-sm">Attendly</div>
                <div className="text-[10px] text-muted-foreground">Student Portal</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{user?.studentId}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {needsOnboarding && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 px-4 py-2 text-center">
          <span className="text-xs text-amber-800 dark:text-amber-200">
            ⚠️ Onboarding incomplete: please{' '}
            <strong>visit the administrative office</strong>
            {!user?.fingerprintEnrolled && !user?.deviceFingerprint && ' to '}
            {!user?.fingerprintEnrolled && (
              <strong>enroll your fingerprint</strong>
            )}
            {!user?.fingerprintEnrolled && !user?.deviceFingerprint && ' and '}
            {!user?.deviceFingerprint && (
              <strong>register your device</strong>
            )}
            {!user?.fingerprintEnrolled && user?.deviceFingerprint ? ' — fingerprint enrollment is pending.' : ''}
            {user?.fingerprintEnrolled && !user?.deviceFingerprint ? ' — device registration is pending.' : ''}
            {!user?.fingerprintEnrolled && !user?.deviceFingerprint ? ' — these steps require admin action.' : ''}
          </span>
        </div>
      )}

      <div className="flex-1 max-w-5xl mx-auto w-full flex">
        <aside className="hidden lg:block w-56 border-r border-border p-3">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = studentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setStudentView(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 bg-card border-r border-border p-3">
              <nav className="space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon
                  const active = studentView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setStudentView(item.id as any)
                        setMobileOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 min-w-0">
          <motion.div
            key={studentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {studentView === 'home' && <StudentDashboard />}
            {studentView === 'biometric' && <StudentBiometric />}
            {studentView === 'device' && <StudentDevice />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
