'use client'

import { motion } from 'framer-motion'
import {
  Fingerprint,
  Smartphone,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

export function StudentOnboarding() {
  const { user, setUser, setShowOnboarding } = useAppStore()
  const [busy, setBusy] = useState(false)

  const fpEnrolled = !!user?.fingerprintEnrolled
  const devRegistered = !!user?.deviceFingerprint
  const allOk = fpEnrolled && devRegistered

  async function handleContinue() {
    setBusy(true)
    try {
      await api('/api/auth/mark-onboarding-seen', { method: 'POST' })
      setUser({ ...(user as any), hasSeenOnboarding: true })
      setShowOnboarding(false)
      toast.success('Welcome to Attendly!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-border">
          <CardHeader className="text-center space-y-3 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
            >
              <GraduationCap className="w-9 h-9 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">Welcome, {user?.name?.split(' ')[0]} 👋</CardTitle>
              <CardDescription className="text-sm">
                One-time onboarding review • Please confirm your biometric &amp; device status
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status cards */}
            <div className="grid sm:grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={fpEnrolled ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fpEnrolled ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                        {fpEnrolled ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Fingerprint className="w-4 h-4 text-primary" />
                          Fingerprint
                        </div>
                        <div className={`text-xs mt-0.5 ${fpEnrolled ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                          {fpEnrolled ? 'Enrolled — you can use biometric login' : 'Not enrolled — contact admin'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className={devRegistered ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/10'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${devRegistered ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                        {devRegistered ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Smartphone className="w-4 h-4 text-primary" />
                          Device
                        </div>
                        <div className={`text-xs mt-0.5 ${devRegistered ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                          {devRegistered ? 'Registered — attendance ready' : 'Not registered — contact admin'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Privacy note */}
            <Card className="border-border bg-muted/30">
              <CardContent className="p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How your data is protected:</strong> Your fingerprint is stored as an irreversible SHA-256 hash — raw biometric never leaves the sensor. Device binding uses canvas + browser signals, no IP address collected. Only administrators can enroll/reset your biometric or change your device.
                </div>
              </CardContent>
            </Card>

            {/* Warning if incomplete */}
            {!allOk && (
              <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-200">
                    Some onboarding steps are incomplete. You can still view your attendance, but biometric attendance marking will be unavailable until an administrator completes your setup.
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue button */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleContinue} disabled={busy} size="lg">
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Continue to dashboard
              </Button>
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              You won&apos;t see this screen again on subsequent logins.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
