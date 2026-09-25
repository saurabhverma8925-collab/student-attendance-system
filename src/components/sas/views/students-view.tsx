'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Loader2,
  Fingerprint,
  Smartphone,
  Filter,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { BiometricDeviceDialog } from './biometric-device-dialog'

interface StudentRow {
  id: string
  studentId: string
  name: string
  branch: string
  section: string
  semester: number
  email: string | null
  phone: string | null
  passwordPlain: string | null
  fingerprintEnrolled: boolean
  deviceFingerprint: string | null
  deviceRegisteredAt: string | null
  hasSeenOnboarding: boolean
  createdAt: string
}

const BRANCHES = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT']

export function StudentsView() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [editing, setEditing] = useState<StudentRow | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [delOpen, setDelOpen] = useState<StudentRow | null>(null)
  const [manageOpen, setManageOpen] = useState<StudentRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (branchFilter !== 'all') params.set('branch', branchFilter)
      const r = await api<{ students: StudentRow[] }>(`/api/students?${params.toString()}`)
      setStudents(r.students)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [search, branchFilter])

  const filtered = useMemo(() => students, [students])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Student Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, search, and remove students. Manage biometric &amp; device enrollment.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <StudentForm
              onDone={() => {
                setAddOpen(false)
                load()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students ({filtered.length})</CardTitle>
          <CardDescription>Search by name, ID, email or phone.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll no, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading students…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No students found. Try adjusting your search.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Sec</TableHead>
                    <TableHead>Sem</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-center">Biometric</TableHead>
                    <TableHead className="text-center">Device</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.01, 0.3) }}
                      className="hover:bg-accent/50"
                    >
                      <TableCell className="font-mono font-medium">{s.studentId}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email || '—'}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.branch}</Badge></TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{s.semester}</TableCell>
                      <TableCell>
                        <PasswordCell password={s.passwordPlain || ''} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Fingerprint className={`w-4 h-4 mx-auto ${s.fingerprintEnrolled ? 'text-emerald-600' : 'text-muted-foreground/40'}`} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Smartphone className={`w-4 h-4 mx-auto ${s.deviceFingerprint ? 'text-emerald-600' : 'text-muted-foreground/40'}`} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setManageOpen(s)} className="text-primary hover:text-primary" aria-label="Manage biometric & device" title="Manage biometric & device">
                            <ShieldCheck className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDelOpen(s)} className="text-destructive hover:text-destructive" aria-label="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <StudentForm
              initial={editing}
              onDone={() => {
                setEditing(null)
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!delOpen} onOpenChange={(o) => !o && setDelOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{delOpen?.name}</strong> ({delOpen?.studentId})?
              This will also remove all attendance records for this student. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await api(`/api/students/${delOpen!.id}`, { method: 'DELETE' })
                  toast.success('Student deleted')
                  setDelOpen(null)
                  load()
                } catch (e: any) {
                  toast.error(e.message)
                }
              }}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BiometricDeviceDialog
        student={manageOpen}
        open={!!manageOpen}
        onOpenChange={(o) => !o && setManageOpen(null)}
        onDone={load}
      />
    </div>
  )
}

function StudentForm({
  initial,
  onDone,
}: {
  initial?: StudentRow
  onDone: () => void
}) {
  const [form, setForm] = useState({
    studentId: initial?.studentId ?? '',
    name: initial?.name ?? '',
    branch: initial?.branch ?? 'CSE',
    section: initial?.section ?? 'A',
    semester: initial?.semester ?? 3,
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    password: initial?.passwordPlain ?? '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [enrollFingerprint, setEnrollFingerprint] = useState(initial?.fingerprintEnrolled ?? false)
  const [registerDevice, setRegisterDevice] = useState(!!initial?.deviceFingerprint)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.password || form.password.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }
    setBusy(true)
    try {
      if (initial) {
        // Edit mode — only update fields that changed
        const payload: any = {
          name: form.name,
          branch: form.branch,
          section: form.section,
          semester: form.semester,
          email: form.email,
          phone: form.phone,
        }
        // Only include password if it changed from current plain password
        if (form.password !== (initial.passwordPlain || '')) {
          payload.password = form.password
        }
        await api(`/api/students/${initial.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast.success('Student updated')
      } else {
        // Add mode — pass everything including enrollment flags
        await api('/api/students', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            enrollFingerprint,
            registerDevice,
          }),
        })
        const parts = [`Student added with password: ${form.password}`]
        if (enrollFingerprint) parts.push('fingerprint enrolled')
        if (registerDevice) parts.push('device registered')
        toast.success(parts.join(' • '))
      }
      onDone()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{initial ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogDescription>
          {initial
            ? 'Update student details or password. Biometric/device use the Manage button.'
            : 'Set the student\'s password and optionally enroll fingerprint + register device now.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label>Student ID / Roll No. *</Label>
          <Input
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            disabled={!!initial}
            placeholder="CSE21001"
            required
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Full Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Aarav Sharma"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Branch *</Label>
          <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Section *</Label>
          <Input
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value.toUpperCase() })}
            maxLength={2}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Semester *</Label>
          <Input
            type="number"
            min={1}
            max={12}
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="9876543210"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="student@college.edu"
          />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>
            {initial ? 'Password (edit and save to change)' : 'Password *'}
          </Label>
          <div className="relative">
            <Input
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required={!initial}
              minLength={4}
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
          {!initial && (
            <p className="text-[11px] text-muted-foreground">
              This password will be visible to admins in the student list so you can share it with the student.
            </p>
          )}
        </div>
      </div>

      {/* On-creation options (only for new students) */}
      {!initial && (
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Onboarding options</Label>
          <label className="flex items-start gap-3 p-2.5 rounded-md border border-border hover:bg-accent/30 cursor-pointer">
            <Switch
              checked={enrollFingerprint}
              onCheckedChange={setEnrollFingerprint}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Fingerprint className="w-3.5 h-3.5 text-primary" />
                Enroll fingerprint now
              </div>
              <div className="text-xs text-muted-foreground">
                Generates a fingerprint template hash for this student. They can use biometric login after first password login.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-2.5 rounded-md border border-border hover:bg-accent/30 cursor-pointer">
            <Switch
              checked={registerDevice}
              onCheckedChange={setRegisterDevice}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Smartphone className="w-3.5 h-3.5 text-primary" />
                Register a device now
              </div>
              <div className="text-xs text-muted-foreground">
                Binds a default device fingerprint to this student. Replace later via the Manage dialog if needed.
              </div>
            </div>
          </label>
        </div>
      )}

      {initial && (
        <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-3">
          <ShieldCheck className="w-4 h-4 inline mr-1 text-primary" />
          To enroll/reset fingerprint or register/unbind device, use the{' '}
          <strong>Manage Biometric &amp; Device</strong> button (shield icon) next to this student in the table.
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
          {initial ? 'Save changes' : 'Add student'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function PasswordCell({ password }: { password: string }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  if (!password) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex items-center gap-1">
      <code className={`font-mono text-xs ${revealed ? '' : 'tracking-widest'}`}>
        {revealed ? password : '••••••'}
      </code>
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="text-muted-foreground hover:text-foreground"
        aria-label={revealed ? 'Hide password' : 'Reveal password'}
      >
        {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={copy}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Copy password"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
