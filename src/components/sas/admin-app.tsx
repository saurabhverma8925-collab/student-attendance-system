'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileBarChart,
  AlertTriangle,
  BookOpen,
  LogOut,
  GraduationCap,
  Menu,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { DashboardView } from './views/dashboard-view'
import { StudentsView } from './views/students-view'
import { AttendanceView } from './views/attendance-view'
import { ReportsView } from './views/reports-view'
import { LowAttendanceView } from './views/low-attendance-view'
import { SubjectsView } from './views/subjects-view'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'low-attendance', label: 'Low Attendance', icon: AlertTriangle },
] as const

export function AdminApp() {
  const { user, setUser, adminView, setAdminView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Close mobile drawer when admin view changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [adminView])

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
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
                <div className="text-[10px] text-muted-foreground">Admin Console</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium">{user?.name}</div>
              <div className="text-[10px] text-muted-foreground">@{user?.username}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full flex">
        {/* Sidebar nav (desktop) */}
        <aside className="hidden lg:block w-56 border-r border-border p-3">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = adminView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminView(item.id as any)}
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

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 bg-card border-r border-border p-3">
              <nav className="space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon
                  const active = adminView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminView(item.id as any)}
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

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          <motion.div
            key={adminView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {adminView === 'dashboard' && <DashboardView />}
            {adminView === 'students' && <StudentsView />}
            {adminView === 'subjects' && <SubjectsView />}
            {adminView === 'attendance' && <AttendanceView />}
            {adminView === 'reports' && <ReportsView />}
            {adminView === 'low-attendance' && <LowAttendanceView />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
