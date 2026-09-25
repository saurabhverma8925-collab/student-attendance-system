'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { LoginScreen } from '@/components/sas/login-screen'
import { AdminApp } from '@/components/sas/admin-app'
import { StudentApp } from '@/components/sas/student-app'

export default function Home() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ user: any }>('/api/auth/me')
      .then((r) => setUser(r.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [setUser])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading Attendly…</p>
      </div>
    )
  }

  if (!user) return <LoginScreen />
  if (user.role === 'admin') return <AdminApp />
  if (user.role === 'student') return <StudentApp />
  return <LoginScreen />
}
