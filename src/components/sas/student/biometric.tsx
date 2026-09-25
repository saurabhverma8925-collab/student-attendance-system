'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Fingerprint,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'

interface DeviceInfo {
  device: {
    deviceFingerprint: string | null
    deviceRegisteredAt: string | null
    fingerprintEnrolled: boolean
  } | null
}

export function StudentBiometric() {
  const { user } = useAppStore()
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<DeviceInfo>('/api/auth/register-device')
      .then(setInfo)
      .finally(() => setLoading(false))
  }, [])

  const enrolled = user?.fingerprintEnrolled ?? info?.device?.fingerprintEnrolled ?? false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Fingerprint className="w-6 h-6 text-primary" />
          Fingerprint Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Your biometric enrollment status. Contact your administrator to enroll or reset.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Enrollment Status</span>
            {enrolled ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Enrolled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Not Enrolled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Fingerprint enrollment is managed by the administrator only. Students cannot self-enroll or reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading status…
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  enrolled ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted'
                }`}
              >
                {enrolled ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                ) : (
                  <Fingerprint className="w-16 h-16 text-muted-foreground" />
                )}
              </motion.div>

              {enrolled ? (
                <div className="text-center space-y-1">
                  <div className="font-medium text-emerald-600">Fingerprint enrolled</div>
                  <div className="text-xs text-muted-foreground">
                    Your biometric template is on file. You can mark attendance via biometric verification.
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 max-w-md">
                  <div className="font-medium">Not enrolled yet</div>
                  <div className="text-xs text-muted-foreground">
                    Please visit the administrative office to complete fingerprint enrollment.
                    Until then, you can still view your attendance records.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            How your fingerprint is protected
          </div>
          <ul className="text-xs text-muted-foreground space-y-1.5 ml-6 list-disc">
            <li>Raw fingerprint image is never stored or transmitted.</li>
            <li>Server stores only a SHA-256 hash of the template — irreversible.</li>
            <li>Verification happens locally; only the hash is matched.</li>
            <li>Only administrators can enroll or reset your fingerprint.</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <strong>Need to reset?</strong> Visit the admin office. Administrators can re-enroll your fingerprint if your device or finger is registered incorrectly, or if you have changed devices.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
