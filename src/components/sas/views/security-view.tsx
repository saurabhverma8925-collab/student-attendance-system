'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Clock,
  Activity,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  Ban,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface FailedAttempt {
  id: string
  username: string
  role: string
  ip: string | null
  createdAt: string
}
interface AuditEntry {
  id: string
  actorId: string
  actorRole: string
  action: string
  target: string | null
  ip: string | null
  createdAt: string
  details: string | null
}
interface AuditByAction {
  action: string
  count: number
}
interface WeakStudent {
  studentId: string
  name: string
  passwordLength: number
}
interface SecurityOverview {
  failedAttempts24h: number
  failedAttemptsList: FailedAttempt[]
  recentAudit: AuditEntry[]
  auditByAction: AuditByAction[]
  activeSessionCount: number
  adminCount: number
  studentCount: number
  passwordPolicy: {
    minLength: number
    requireLetters: boolean
    requireDigits: boolean
    weakPasswordCount: number
    weakPasswordStudents: WeakStudent[]
  }
  rateLimit: {
    auth: { maxAttempts: number; windowMinutes: number; blockMinutes: number }
    qrVerify: { maxAttempts: number; windowMinutes: number; blockMinutes: number }
  }
  sessionExpiryHours: number
  securityHeaders: string[]
}

const ACTION_LABELS: Record<string, string> = {
  'auth.admin.login.success': 'Admin login',
  'auth.admin.login.failed': 'Admin login FAILED',
  'auth.student.login.success': 'Student login',
  'auth.student.login.failed': 'Student login FAILED',
  'student.create': 'Student added',
  'student.delete': 'Student DELETED',
  'attendance.qr_marked': 'QR attendance marked',
  'security.weak_bootstrap_admin': 'Weak bootstrap admin',
}

export function SecurityView() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<SecurityOverview>('/api/security/overview')
      .then(setOverview)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading security overview…
      </div>
    )
  }
  if (!overview) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Failed to load.</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Security Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Audit log, failed login attempts, active sessions, and password policy status.
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Failed logins (24h)"
          value={overview.failedAttempts24h}
          icon={AlertTriangle}
          tone={overview.failedAttempts24h > 5 ? 'destructive' : 'primary'}
          hint="Brute-force attempts blocked by rate limiter"
        />
        <StatCard
          label="Active sessions"
          value={overview.activeSessionCount}
          icon={Activity}
          tone="primary"
          hint={`Sessions expire after ${overview.sessionExpiryHours}h of inactivity`}
        />
        <StatCard
          label="Weak passwords"
          value={overview.passwordPolicy.weakPasswordCount}
          icon={KeyRound}
          tone={overview.passwordPolicy.weakPasswordCount > 0 ? 'destructive' : 'primary'}
          hint={`Policy: min ${overview.passwordPolicy.minLength} chars, letters + digits`}
        />
        <StatCard
          label="Admins"
          value={overview.adminCount}
          icon={Users}
          tone="primary"
          hint={`${overview.studentCount} students enrolled`}
        />
      </div>

      {/* Security posture checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Security Posture
          </CardTitle>
          <CardDescription>Active protections applied across the app.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <PostureRow label="HTTPS enforcement" desc="301 redirect to https in production" ok />
          <PostureRow label="Security headers middleware" desc="CSP, X-Frame, HSTS, Referrer-Policy" ok />
          <PostureRow label="Bcrypt password hashing" desc="Cost factor 12 — resistant to brute-force" ok />
          <PostureRow label="Rate limiting on login" desc={`${overview.rateLimit.auth.maxAttempts} attempts/min, block ${overview.rateLimit.auth.blockMinutes}min`} ok />
          <PostureRow label="Rate limiting on QR verify" desc={`${overview.rateLimit.qrVerify.maxAttempts} attempts/min, block ${overview.rateLimit.qrVerify.blockMinutes}min`} ok />
          <PostureRow label="Session expiry (sliding)" desc={`${overview.sessionExpiryHours}h since last activity`} ok />
          <PostureRow label="Constant-time login" desc="Prevents username enumeration via timing" ok />
          <PostureRow label="Audit logging" desc="All sensitive actions recorded" ok />
          <PostureRow
            label="Default admin password"
            desc="admin/admin123 — change immediately in production"
            ok={false}
            warn
          />
          <PostureRow
            label="Plain-text password storage"
            desc="By design — visible to admin for credential recovery. Mitigate by deleting the column in prod if not needed."
            ok={false}
            warn
          />
        </CardContent>
      </Card>

      {/* Failed login attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-600" />
            Failed Login Attempts (Last 24h)
          </CardTitle>
          <CardDescription>
            Each failed attempt is recorded with IP for forensics. Rate-limited automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.failedAttemptsList.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No failed login attempts in the last 24 hours.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.failedAttemptsList.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.username}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{f.role}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{f.ip || '—'}</TableCell>
                      <TableCell className="text-right text-xs">{new Date(f.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Audit Log (Last 50 Actions)
          </CardTitle>
          <CardDescription>Sensitive actions performed across the app.</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.recentAudit.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No audit entries yet.</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentAudit.map((a) => (
                    <TableRow key={a.id} className={a.action.includes('failed') || a.action.includes('delete') ? 'bg-rose-50/40 dark:bg-rose-950/10' : ''}>
                      <TableCell className="font-mono text-[11px]">
                        {ACTION_LABELS[a.action] || a.action}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize mr-1">{a.actorRole}</Badge>
                        <span className="font-mono text-[10px]">{a.actorId.slice(0, 12)}…</span>
                      </TableCell>
                      <TableCell className="font-mono text-[10px]">{a.target ? a.target.slice(0, 12) + '…' : '—'}</TableCell>
                      <TableCell className="font-mono text-[10px]">{a.ip || '—'}</TableCell>
                      <TableCell className="text-right text-[10px]">{new Date(a.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weak passwords list (if any) */}
      {overview.passwordPolicy.weakPasswordCount > 0 && (
        <Card className="border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
              Students with Weak Passwords ({overview.passwordPolicy.weakPasswordCount})
            </CardTitle>
            <CardDescription>Update these via the Edit Student dialog.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Password length</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.passwordPolicy.weakPasswordStudents.map((s) => (
                    <TableRow key={s.studentId}>
                      <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right text-rose-700 dark:text-rose-300 font-mono">{s.passwordLength} chars</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string
  value: number
  icon: any
  tone: 'primary' | 'destructive'
  hint: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone === 'destructive' ? 'bg-rose-100 dark:bg-rose-950' : 'bg-primary/10'}`}>
              <Icon className={`w-5 h-5 ${tone === 'destructive' ? 'text-rose-600' : 'text-primary'}`} />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
          <div className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border">{hint}</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PostureRow({
  label,
  desc,
  ok,
  warn,
}: {
  label: string
  desc: string
  ok: boolean
  warn?: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
      <div className="shrink-0 mt-0.5">
        {ok ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : warn ? (
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  )
}
