'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Fingerprint,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { getBrowserFingerprint } from '@/lib/client/fingerprint'
import { toast } from 'sonner'

export function StudentDevice() {
  const { user, setUser } = useAppStore()
  const [busy, setBusy] = useState(false)
  const [currentFp, setCurrentFp] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function loadDeviceInfo() {
    try {
      const r = await api<{ device: any }>('/api/auth/register-device')
      setDeviceInfo(r.device)
    } catch (e: any) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeviceInfo()
  }, [])

  async function register() {
    setBusy(true)
    try {
      const fp = await getBrowserFingerprint()
      setCurrentFp(fp)
      await api('/api/auth/register-device', {
        method: 'POST',
        body: JSON.stringify({ deviceFingerprint: fp }),
      })
      toast.success('This device is now registered to your account.')
      setUser({ ...(user as any), deviceFingerprint: fp })
      loadDeviceInfo()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const isRegistered = !!user?.deviceFingerprint

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-primary" />
          Device Registration
        </h1>
        <p className="text-sm text-muted-foreground">
          One device per student policy. After registration, attendance can only be marked from this device.
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
              <Badge variant="secondary">Not registered</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Device fingerprint is computed from canvas, user-agent, screen, timezone — no IP address used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 py-4">
            <motion.div
              animate={busy ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.8, repeat: busy ? Infinity : 0 }}
              className={`w-36 h-36 rounded-2xl flex items-center justify-center ${
                isRegistered ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted'
              }`}
            >
              {busy ? (
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              ) : isRegistered ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              ) : (
                <Smartphone className="w-16 h-16 text-muted-foreground" />
              )}
            </motion.div>

            <div className="text-center space-y-2 max-w-md">
              {isRegistered ? (
                <>
                  <div className="font-medium text-emerald-600">
                    This device is bound to your account.
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fingerprint hash: <code className="font-mono text-[10px] break-all">{(user?.deviceFingerprint || '').slice(0, 32)}…</code>
                    <br />
                    Registered at: {deviceInfo?.device?.deviceRegisteredAt ? new Date(deviceInfo.device.deviceRegisteredAt).toLocaleString() : '—'}
                  </p>
                  <Button variant="outline" onClick={register} disabled={busy}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Re-register on this device
                  </Button>
                </>
              ) : (
                <>
                  <div className="font-medium">No device registered yet</div>
                  <p className="text-xs text-muted-foreground">
                    Click the button below to bind this browser/device to your account.
                    Only one device is allowed per student.
                  </p>
                  <Button onClick={register} disabled={busy} size="lg">
                    {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                    Register this device
                  </Button>
                </>
              )}
            </div>
          </div>
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
              <li>Combined with biometric scan, ensures only the registered student marks their own attendance.</li>
              <li>Device-bound credentials make stolen-password attacks ineffective.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Fingerprint className="w-4 h-4 text-amber-600" />
              Lost your device?
            </div>
            <p className="text-xs text-muted-foreground">
              Contact your administrator. They can reset your device binding from the Student Management screen so you can re-register a new device.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
