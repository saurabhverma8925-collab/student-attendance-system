'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  ShieldCheck,
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
  } | null
}

export function StudentDevice() {
  const { user } = useAppStore()
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<DeviceInfo>('/api/auth/register-device')
      .then(setInfo)
      .finally(() => setLoading(false))
  }, [])

  const isRegistered = !!(user?.deviceFingerprint || info?.device?.deviceFingerprint)
  const registeredAt = info?.device?.deviceRegisteredAt
  const fp = user?.deviceFingerprint || info?.device?.deviceFingerprint || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-primary" />
          Device Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Your registered device. Only administrators can register or unbind devices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Registration Status</span>
            {isRegistered ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Registered
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Not Registered
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            One device per student policy. Device binding is admin-controlled.
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
                className={`w-32 h-32 rounded-2xl flex items-center justify-center ${
                  isRegistered ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted'
                }`}
              >
                {isRegistered ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                ) : (
                  <Smartphone className="w-16 h-16 text-muted-foreground" />
                )}
              </motion.div>

              {isRegistered ? (
                <div className="text-center space-y-2 max-w-md">
                  <div className="font-medium text-emerald-600">
                    A device is bound to your account.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>
                      Registered at: <strong>{registeredAt ? new Date(registeredAt).toLocaleString() : '—'}</strong>
                    </div>
                    <div className="mt-1">
                      Device fingerprint: <code className="font-mono text-[10px] break-all">{fp ? fp.slice(0, 32) : '—'}…</code>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    To change your registered device, contact the administrative office.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 max-w-md">
                  <div className="font-medium">No device registered yet</div>
                  <p className="text-xs text-muted-foreground">
                    Please visit the administrative office to register your device.
                    Until your device is registered, attendance marking will be unavailable.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Why one device per student?
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 ml-6 list-disc">
              <li>Prevents proxy attendance on behalf of absentees.</li>
              <li>Ensures only the registered student can mark their own attendance.</li>
              <li>Device-bound credentials make stolen-password attacks ineffective.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Smartphone className="w-4 h-4 text-amber-600" />
              Lost or changed your device?
            </div>
            <p className="text-xs text-muted-foreground">
              Visit the administrative office. An administrator can unbind your old device and register a new one for you. Students cannot self-register or self-unbind.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Privacy note:</strong> No IP address is collected. The device fingerprint is derived from canvas rendering, user-agent, screen, and timezone signals — all processed locally on the admin&apos;s terminal during registration.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
