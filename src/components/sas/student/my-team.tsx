'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Crown,
  User,
  Loader2,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Send,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
}

interface Invitation {
  id: string
  teamId: string
  inviteeEmail: string
  status: string
  team: {
    id: string
    teamName: string
    members: { student: { name: string; studentId: string } }[]
  }
}

function statusVariant(status: string) {
  if (status === 'finalized') return 'default' as const
  if (status === 'locked') return 'secondary' as const
  return 'outline' as const
}

function reviewBadge(rs: ReviewSubmission | undefined) {
  if (!rs) return <Badge variant="outline" className="text-[10px]">Not submitted</Badge>
  if (rs.status === 'approved')
    return (
      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    )
  if (rs.status === 'rejected')
    return (
      <Badge className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px]">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </Badge>
  )
}

export function MyTeamView() {
  const [team, setTeam] = useState<Team | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  // create team form
  const [createOpen, setCreateOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')

  // invite form
  const [inviteEmail, setInviteEmail] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await api<{ team: Team | null; role: string | null; invitations: Invitation[] }>(
        '/api/teams',
      )
      setTeam(r.team)
      setRole(r.role)
      setInvitations(r.invitations)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createTeam() {
    if (!newTeamName.trim()) return toast.error('Team name is required')
    setBusy('create')
    try {
      await api('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ teamName: newTeamName }),
      })
      toast.success('Team created! You are the leader.')
      setCreateOpen(false)
      setNewTeamName('')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function respondInvite(inv: Invitation, status: 'accepted' | 'declined') {
    setBusy(`${inv.id}:${status}`)
    try {
      await api(`/api/teams/invitations/${inv.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      })
      toast.success(`Invitation ${status}`)
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function sendInvite() {
    if (!team) return
    if (!inviteEmail.trim()) return toast.error('Email is required')
    setBusy('invite')
    try {
      await api('/api/teams/invitations', {
        method: 'POST',
        body: JSON.stringify({ teamId: team.id, inviteeEmail: inviteEmail }),
      })
      toast.success('Invitation sent')
      setInviteEmail('')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading your team…
      </div>
    )
  }

  // No team: invitations + create form
  if (!team) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Team</h1>
          <p className="text-sm text-muted-foreground">
            You are not part of any team yet. Accept an invitation or create your own.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Pending Invitations
                </CardTitle>
                <CardDescription className="text-xs">
                  Teams that have invited you to join them.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {invitations.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Mail className="w-8 h-8 mx-auto mb-3 opacity-50" />
                No pending invitations.
              </div>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{inv.team.teamName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Leader: {inv.team.members.find((m) => m.role === 'Leader')?.student.name || '—'}
                      {' · '}
                      {inv.team.members.length} members
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => respondInvite(inv, 'declined')}
                      disabled={busy === `${inv.id}:declined`}
                    >
                      {busy === `${inv.id}:declined` ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => respondInvite(inv, 'accepted')}
                      disabled={busy === `${inv.id}:accepted`}
                    >
                      {busy === `${inv.id}:accepted` ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Create a Team
            </CardTitle>
            <CardDescription className="text-xs">
              You will be the team leader and can invite up to 3 more members (3-4 total).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-team">Team Name</Label>
              <Input
                id="new-team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Code Wizards"
                maxLength={60}
              />
            </div>
            <Button onClick={() => setCreateOpen(true)} disabled={!newTeamName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Create Team
            </Button>
          </CardContent>
        </Card>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create team &ldquo;{newTeamName}&rdquo;?</DialogTitle>
              <DialogDescription>
                You will be the leader. The team will start in &ldquo;forming&rdquo; status until
                you finalize it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={busy === 'create'}>
                Cancel
              </Button>
              <Button onClick={createTeam} disabled={busy === 'create'}>
                {busy === 'create' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Team view
  const leader = team.members.find((m) => m.role === 'Leader')
  const otherMembers = team.members.filter((m) => m.role !== 'Leader')
  const r0 = team.reviewSubmissions.find((s) => s.reviewNumber === 0)
  const r1 = team.reviewSubmissions.find((s) => s.reviewNumber === 1)
  const r2 = team.reviewSubmissions.find((s) => s.reviewNumber === 2)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            {team.teamName}
            <Badge variant={statusVariant(team.status)} className="text-[10px] capitalize">
              {team.status}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            {team.members.length} member(s) · You are the{' '}
            <span className="font-medium">{role || 'Member'}</span>
          </p>
        </div>
      </div>

      {/* Members grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {leader && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{leader.student.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {leader.student.studentId}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {leader.student.email}
                </div>
                <Badge className="mt-1 text-[9px]">Leader</Badge>
              </div>
            </CardContent>
          </Card>
        )}
        {otherMembers.map((m) => (
          <Card key={m.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.student.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {m.student.studentId}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {m.student.email}
                </div>
                <Badge variant="outline" className="mt-1 text-[9px]">
                  Member
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {team.status === 'forming' && team.members.length < 4 && (
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center justify-center h-full">
              <div className="text-center">
                <Plus className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                <div className="text-xs text-muted-foreground">Invite a member</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leader invite form (only when forming) */}
      {role === 'Leader' && team.status === 'forming' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" /> Invite a Member
            </CardTitle>
            <CardDescription className="text-xs">
              Invite by student email. The student will see a pending invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="pl-9"
                />
              </div>
              <Button onClick={sendInvite} disabled={busy === 'invite' || !inviteEmail.trim()}>
                {busy === 'invite' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Send Invite
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review progress summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Progress</CardTitle>
          <CardDescription className="text-xs">
            R0 → R1 → R2 progression status for this team.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Review 0</div>
            {reviewBadge(r0)}
            {r0?.marksAwarded !== null && r0?.marksAwarded !== undefined && (
              <div className="text-[10px] text-muted-foreground">
                {r0.marksAwarded} marks
              </div>
            )}
          </div>
          <div className="rounded-md border border-border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Review 1</div>
            {reviewBadge(r1)}
            {r1?.marksAwarded !== null && r1?.marksAwarded !== undefined && (
              <div className="text-[10px] text-muted-foreground">
                {r1.marksAwarded}/33 marks
              </div>
            )}
          </div>
          <div className="rounded-md border border-border p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Review 2</div>
            {reviewBadge(r2)}
            {r2?.marksAwarded !== null && r2?.marksAwarded !== undefined && (
              <div className="text-[10px] text-muted-foreground">
                {r2.marksAwarded}/17 marks
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Formation Format preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Team Formation Format
          </CardTitle>
          <CardDescription className="text-xs">
            The format required for project submission (S.No, Team Name, Member Role, Email ID, Name of Student).
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {team.members.map((m, i) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{team.teamName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{m.student.email}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{m.student.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.student.studentId}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
