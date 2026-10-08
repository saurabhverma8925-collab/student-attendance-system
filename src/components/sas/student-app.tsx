'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, FileText, Calendar, LogOut, GraduationCap, Menu } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { MyTeamView } from './student/my-team'
import { TopicSelectionView } from './student/topic-selection'
import { MyReviewsView } from './student/my-reviews'
import { StudentLiveSessions } from './student/live-sessions'

const NAV = [
  { id: 'my-team', label: 'My Team', icon: Users },
  { id: 'topic-selection', label: 'Topic Selection', icon: BookOpen },
  { id: 'my-reviews', label: 'My Reviews', icon: FileText },
  { id: 'live-sessions', label: 'Live Sessions', icon: Calendar },
] as const

export function StudentApp() {
  const { user, setUser, studentView, setStudentView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [studentView])
  async function logout() { await api('/api/auth/logout', { method: 'POST' }); setUser(null) }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-md hover:bg-accent" onClick={() => setMobileOpen(s => !s)} aria-label="Toggle navigation"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary" /></div>
              <div className="leading-tight"><div className="font-semibold text-sm">Attendly</div><div className="text-[10px] text-muted-foreground">Java Project Portal</div></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block"><div className="text-xs font-medium">{user?.name}</div><div className="text-[10px] text-muted-foreground font-mono">{user?.studentId}</div></div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive"><LogOut className="w-4 h-4 mr-1" />Sign out</Button>
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-5xl mx-auto w-full flex">
        <aside className="hidden lg:block w-56 border-r border-border p-3">
          <nav className="space-y-1">
            {NAV.map(item => { const Icon = item.icon; const active = studentView === item.id; return (
              <button key={item.id} onClick={() => setStudentView(item.id as any)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}><Icon className="w-4 h-4" />{item.label}</button>
            )})}
          </nav>
        </aside>
        {mobileOpen && (<div className="lg:hidden fixed inset-0 z-40 flex"><div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} /><aside className="relative w-64 bg-card border-r border-border p-3"><nav className="space-y-1">{NAV.map(item => { const Icon = item.icon; const active = studentView === item.id; return (<button key={item.id} onClick={() => { setStudentView(item.id as any); setMobileOpen(false) }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}><Icon className="w-4 h-4" />{item.label}</button>)})}</nav></aside></div>)}
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          <motion.div key={studentView} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {studentView === 'my-team' && <MyTeamView />}
            {studentView === 'topic-selection' && <TopicSelectionView />}
            {studentView === 'my-reviews' && <MyReviewsView />}
            {studentView === 'live-sessions' && <StudentLiveSessions />}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
