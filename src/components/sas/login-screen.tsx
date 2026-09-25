'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  ShieldCheck,
  Loader2,
  Users,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'

export function LoginScreen() {
  const { setUser } = useAppStore()
  const [tab, setTab] = useState<'admin' | 'student'>('admin')

  // Admin fields
  const [adminUsername, setAdminUsername] = useState('admin')
  const [adminPassword, setAdminPassword] = useState('admin123')

  // Student fields
  const [studentUsername, setStudentUsername] = useState('CSE21001')
  const [studentPassword, setStudentPassword] = useState('student123')

  const [busy, setBusy] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      })
      setUser(r.user)
      toast.success(`Welcome back, ${r.user.name}`)
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api('/api/auth/student-login', {
        method: 'POST',
        body: JSON.stringify({ username: studentUsername, password: studentPassword }),
      })
      setUser(r.user)
      toast.success(`Welcome, ${r.user.name}`)
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30">
      <main className="flex-1 grid lg:grid-cols-2 gap-6 items-center max-w-7xl mx-auto w-full px-4 py-8 lg:py-16">
        {/* Left brand panel */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 lg:pr-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Attendly • Student Attendance System
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Attendance, <span className="text-primary">simplified.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md">
            One-device-per-student enforcement. Real-time low-attendance alerts below 75%. Per-subject &amp; per-student analytics.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>One-device registration per student (device-bound)</span>
            </li>
            <li className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-primary" />
              <span>Admin-controlled device enrollment</span>
            </li>
            <li className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span>Detailed reports with low-attendance alerts</span>
            </li>
          </ul>
        </motion.section>

        {/* Right login panel */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Sign in</h2>
                  <p className="text-xs text-muted-foreground">Choose your role to continue</p>
                </div>
              </div>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="px-6 pb-6">
              <TabsList className="grid grid-cols-2 w-full mb-5">
                <TabsTrigger value="admin">Admin / Faculty</TabsTrigger>
                <TabsTrigger value="student">Student</TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-u">Username</Label>
                    <Input
                      id="admin-u"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-p">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-p"
                        type={showPwd ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle password visibility"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sign in as Admin
                  </Button>
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Demo: <code className="font-mono">admin</code> / <code className="font-mono">admin123</code>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stu-u">Student ID / Roll No.</Label>
                    <Input
                      id="stu-u"
                      value={studentUsername}
                      onChange={(e) => setStudentUsername(e.target.value)}
                      placeholder="CSE21001"
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stu-p">Password</Label>
                    <div className="relative">
                      <Input
                        id="stu-p"
                        type={showPwd ? 'text' : 'password'}
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle password visibility"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Sign in as Student
                  </Button>
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Demo: <code className="font-mono">CSE21001</code> / <code className="font-mono">student123</code>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.section>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-4">
        Attendly — Student Attendance System
      </footer>
    </div>
  )
}
