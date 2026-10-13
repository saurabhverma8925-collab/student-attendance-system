'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Crown,
  User,
  CheckCircle2,
  Lock,
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

interface TeamMember {
  id: string
  role: string
  student: {
    id: string
    studentId: string
    name: string
    email: string
  }
}

interface ReviewSubmission {
  id: string
  reviewNumber: number
  status: string
  marksAwarded: number | null
}

interface Team {
  id: string
  teamName: string
  status: string
  members: TeamMember[]
  reviewSubmissions: ReviewSubmission[]
  createdAt?: string
}

interface StudentOption {
  id: string
  studentId: string
  name: string
  email: string
}

function statusVariant(status: string) {
  if (status === 'finalized') return 'default' as const
  if (status === 'locked') return 'secondary' as const
  return 'outline' as const
}

function TeamFormationTable({ team, index = 1 }: { team: Team; index?: number }) {
  const rows = team.members.map((m) => ({
    role: m.role,
    name: m.student.name,
    studentId: m.student.studentId,
    email: m.student.email,
  }))
  return (
    <div className="rounded-md border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">S.No</TableHead>
            <TableHead>Team Name</TableHead>
            <TableHead>Member Role</TableHead>
            <TableHead>Email ID</TableHead>
            <TableHead>Name of Student</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{index}.{i + 1}</TableCell>
              <TableCell>{team.teamName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px]">
                  {r.role}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">{r.email}</TableCell>
              <TableCell>
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-[10px] text-muted-foreground">{r.studentId}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function TeamsView() {
  const [teams, setTeams] = useState<Team[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  // create form state
  const [teamName, setTeamName] = useState('')
  const [facultyMentorId, setFacultyMentorId] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])

  async function load() {
    setLoading(true)
    try {
      const [tr, sr] = await Promise.all([
        api<{ teams: Team[] }>('/api/teams'),
        api<{ students: StudentOption[] }>('/api/students'),
      ])
      setTeams(tr.teams)
      setStudents(sr.students)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function toggleMember(id: string) {
    setMemberIds((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= 4) {
        toast.error('Maximum 4 members allowed')
        return cur
      }
      return [...cur, id]
    })
  }

  async function createTeam() {
    if (!teamName.trim()) return toast.error('Team name is required')
    if (!facultyMentorId) return toast.error('Faculty mentor is required')
    if (memberIds.length < 3 || memberIds.length > 4)
      return toast.error('Team must have 3-4 members')
    setBusy('create')
    try {
      await api('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ teamName, facultyMentorId, memberIds }),
      })
      toast.success('Team created')
      setCreateOpen(false)
      setTeamName('')
      setFacultyMentorId('')
      setMemberIds([])
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function setStatus(team: Team, status: 'forming' | 'finalized' | 'locked') {
    setBusy(`${team.id}:${status}`)
    try {
      await api(`/api/teams/${team.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      toast.success(`Team marked as ${status}`)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function deleteTeam(team: Team) {
    if (!confirm(`Delete team "${team.teamName}"? This cannot be undone.`)) return
    setBusy(`${team.id}:delete`)
    try {
      await api(`/api/teams/${team.id}`, { method: 'DELETE' })
      toast.success('Team deleted')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">
            Manage project teams, finalize formations, lock submissions.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a new team</DialogTitle>
              <DialogDescription>
                Teams require a leader plus 2-3 members (3-4 members total).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="t-teamName">Team Name</Label>
                <Input
                  id="t-teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Code Wizards"
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Faculty Mentor ID</Label>
                <Input
                  value={facultyMentorId}
                  onChange={(e) => setFacultyMentorId(e.target.value)}
                  placeholder="Admin ID (e.g. admin-uuid)"
                />
                <p className="text-[10px] text-muted-foreground">
                  Paste the faculty admin ID. This will be the assigned mentor.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Members ({memberIds.length}/4 — min 3)</Label>
                <div className="max-h-56 overflow-y-auto rounded-md border border-border divide-y">
                  {students.length === 0 && (
                    <div className="p-3 text-xs text-muted-foreground">No students found.</div>
                  )}
                  {students.map((s) => {
                    const checked = memberIds.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMember(s.id)}
                          className="h-4 w-4 accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {s.studentId} · {s.email}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={busy === 'create'}>
                Cancel
              </Button>
              <Button onClick={createTeam} disabled={busy === 'create'}>
                {busy === 'create' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Create Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading teams…
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No teams yet. Click <strong>Create Team</strong> to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team, idx) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {team.teamName}
                        <Badge variant={statusVariant(team.status)} className="text-[10px] capitalize">
                          {team.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {team.members.length} member(s) ·{' '}
                        {team.reviewSubmissions.length} submission(s)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {team.status !== 'finalized' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setStatus(team, 'finalized')}
                          disabled={busy === `${team.id}:finalized`}
                        >
                          {busy === `${team.id}:finalized` ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          )}
                          Finalize
                        </Button>
                      )}
                      {team.status === 'finalized' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStatus(team, 'locked')}
                          disabled={busy === `${team.id}:locked`}
                        >
                          {busy === `${team.id}:locked` ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 mr-1" />
                          )}
                          Lock
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTeam(team)}
                        disabled={busy === `${team.id}:delete`}
                      >
                        {busy === `${team.id}:delete` ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {team.members.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-md border border-border p-3 flex items-start gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {m.role === 'Leader' ? (
                            <Crown className="w-4 h-4 text-primary" />
                          ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{m.student.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {m.student.studentId}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {m.student.email}
                          </div>
                          <Badge variant="outline" className="text-[9px] mt-1">
                            {m.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {team.reviewSubmissions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {team.reviewSubmissions.map((rs) => (
                        <Badge
                          key={rs.id}
                          variant={rs.status === 'approved' ? 'default' : 'outline'}
                          className="text-[10px]"
                        >
                          R{rs.reviewNumber}: {rs.status}
                          {rs.marksAwarded !== null ? ` · ${rs.marksAwarded}` : ''}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        setExpanded((cur) => (cur === team.id ? null : team.id))
                      }
                    >
                      {expanded === team.id
                        ? 'Hide Team Formation Format'
                        : 'Preview Team Formation Format'}
                    </Button>
                    {expanded === team.id && (
                      <div className="mt-2">
                        <TeamFormationTable team={team} index={idx + 1} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
