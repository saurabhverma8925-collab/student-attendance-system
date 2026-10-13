'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Calendar as CalIcon,
  BookOpen,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Subject {
  id: string
  code: string
  name: string
  branch: string
  semester: number
}

interface Student {
  id: string
  studentId: string
  name: string
  branch: string
  section: string
  semester: number
}

export function AttendanceView() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjectId, setSubjectId] = useState<string>('')
  // Use the user's local date (not UTC) so the input shows today correctly
  const [date, setDate] = useState<string>(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
  const [records, setRecords] = useState<Record<string, 'Present' | 'Absent'>>({})
  const [busy, setBusy] = useState(false)
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    api<{ subjects: Subject[] }>('/api/subjects').then((r) => {
      setSubjects(r.subjects)
      if (r.subjects[0]) setSubjectId(r.subjects[0].id)
    })
  }, [])

  // Load students for selected subject's branch+semester
  useEffect(() => {
    if (!subjectId) return
    const subj = subjects.find((s) => s.id === subjectId)
    if (!subj) return
    setLoadingList(true)
    api<{ students: Student[] }>(`/api/students?branch=${subj.branch}&semester=${subj.semester}`)
      .then((r) => {
        setStudents(r.students)
        // Initialize records: default everyone to Present
        const init: Record<string, 'Present' | 'Absent'> = {}
        r.students.forEach((s) => (init[s.id] = 'Present'))
        setRecords(init)
      })
      .finally(() => setLoadingList(false))

    // Also load existing attendance for the date+subject to prefill
    api<{ records: any[] }>(`/api/attendance/daily?date=${date}&subjectId=${subjectId}`)
      .then((r) => {
        setRecords((prev) => {
          const next = { ...prev }
          r.records.forEach((rec) => {
            next[rec.studentId] = rec.status as 'Present' | 'Absent'
          })
          return next
        })
      })
      .catch(() => {})
  }, [subjectId, date, subjects])

  const presentCount = useMemo(
    () => Object.values(records).filter((s) => s === 'Present').length,
    [records],
  )
  const absentCount = useMemo(
    () => Object.values(records).filter((s) => s === 'Absent').length,
    [records],
  )

  async function save() {
    if (!subjectId || !date) return toast.error('Subject and date required')
    setBusy(true)
    try {
      const payload = Object.entries(records).map(([studentId, status]) => ({
        studentId,
        status,
      }))
      const r = await api('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ subjectId, date, records: payload }),
      })
      toast.success(`Attendance saved for ${r.marked} students`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  function setAll(status: 'Present' | 'Absent') {
    const next: Record<string, 'Present' | 'Absent'> = {}
    students.forEach((s) => (next[s.id] = status))
    setRecords(next)
  }

  const selectedSubject = subjects.find((s) => s.id === subjectId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-primary" />
          Mark Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Select subject and date, then toggle present/absent for each student. Changes are saved in one transaction.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Selection</CardTitle>
          <CardDescription>Pick subject, date — student list auto-populates from subject&apos;s branch &amp; semester.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.name} ({s.branch} / Sem {s.semester})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><CalIcon className="w-3.5 h-3.5" /> Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {students.length} Students • {selectedSubject.code}
              </CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mr-2">{presentCount} Present</Badge>
                <Badge variant="outline">{absentCount} Absent</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAll('Present')}>
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                Mark all present
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAll('Absent')}>
                <XCircle className="w-4 h-4 mr-1 text-rose-600" />
                Mark all absent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading student list…
              </div>
            ) : students.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No students match this subject&apos;s branch ({selectedSubject.branch}) and semester ({selectedSubject.semester}).
              </div>
            ) : (
              <div className="max-h-[55vh] overflow-y-auto pr-1">
                <div className="grid gap-2">
                  {students.map((s, i) => {
                    const status = records[s.id] || 'Present'
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.3) }}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{s.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{s.studentId} • Sec {s.section}</div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant={status === 'Present' ? 'default' : 'outline'}
                            onClick={() => setRecords({ ...records, [s.id]: 'Present' })}
                            className={status === 'Present' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={status === 'Absent' ? 'default' : 'outline'}
                            onClick={() => setRecords({ ...records, [s.id]: 'Absent' })}
                            className={status === 'Absent' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Absent
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {students.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={save} disabled={busy} size="lg" className="shadow-xl">
            {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  )
}
