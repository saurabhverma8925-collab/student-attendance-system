'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileBarChart,
  User,
  Book,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Percent,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ReportsView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChart className="w-6 h-6 text-primary" />
          Attendance Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          View per-student and per-subject attendance breakdowns with percentages.
        </p>
      </div>

      <Tabs defaultValue="student">
        <TabsList className="grid grid-cols-2 max-w-md">
          <TabsTrigger value="student"><User className="w-4 h-4 mr-1" /> Student-wise</TabsTrigger>
          <TabsTrigger value="subject"><Book className="w-4 h-4 mr-1" /> Subject-wise</TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <StudentReport />
        </TabsContent>
        <TabsContent value="subject">
          <SubjectReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface StudentRow {
  id: string
  studentId: string
  name: string
  branch: string
  section: string
  semester: number
}

function StudentReport() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [selected, setSelected] = useState<string>('')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api<{ students: StudentRow[] }>('/api/students').then((r) => {
      setStudents(r.students)
      if (r.students[0]) setSelected(r.students[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api(`/api/reports/student?id=${selected}`)
      .then(setReport)
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student-wise Report</CardTitle>
        <CardDescription>Subject-wise attendance of every subject for a given student.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Select student" /></SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.studentId} — {s.name} ({s.branch})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading report…
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <SummaryCard
                label="Total Classes"
                value={report.overall.totalClasses}
                icon={<Book className="w-4 h-4" />}
              />
              <SummaryCard
                label="Present"
                value={report.overall.present}
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              />
              <SummaryCard
                label="Absent"
                value={report.overall.absent}
                icon={<XCircle className="w-4 h-4 text-rose-600" />}
              />
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Percent className="w-4 h-4 text-primary" /> Overall Attendance
                </div>
                <div className={`text-xl font-bold ${report.overall.percentage >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {report.overall.percentage}%
                </div>
              </div>
              <Progress value={report.overall.percentage} className="h-2" />
              {report.overall.lowAttendance && (
                <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Warning: Below 75% threshold
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.subjects.map((s: any) => (
                    <TableRow key={s.subjectId} className={s.lowAttendance ? 'bg-rose-50 dark:bg-rose-950/20' : ''}>
                      <TableCell><Badge variant="secondary">{s.code}</Badge></TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right">{s.totalClasses}</TableCell>
                      <TableCell className="text-right text-emerald-600">{s.present}</TableCell>
                      <TableCell className="text-right text-rose-600">{s.absent}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.percentage >= 75 ? 'default' : 'destructive'}>
                          {s.percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">Select a student to view report.</div>
        )}
      </CardContent>
    </Card>
  )
}

interface SubjectRow {
  id: string
  code: string
  name: string
}

function SubjectReport() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [selected, setSelected] = useState<string>('')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api<{ subjects: SubjectRow[] }>('/api/subjects').then((r) => {
      setSubjects(r.subjects)
      if (r.subjects[0]) setSelected(r.subjects[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    api(`/api/reports/subject?id=${selected}`)
      .then(setReport)
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject-wise Report</CardTitle>
        <CardDescription>Class attendance summary — present/absent/percentage for every student in the subject.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Select subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.code} — {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading report…
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-4 gap-3">
              <SummaryCard
                label="Total Classes"
                value={report.subject.totalClasses}
                icon={<Book className="w-4 h-4" />}
              />
              <SummaryCard
                label="Total Records"
                value={report.overall.totalRecords}
                icon={<FileBarChart className="w-4 h-4" />}
              />
              <SummaryCard
                label="Total Present"
                value={report.overall.present}
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              />
              <SummaryCard
                label="Total Absent"
                value={report.overall.absent}
                icon={<XCircle className="w-4 h-4 text-rose-600" />}
              />
            </div>

            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Percent className="w-4 h-4 text-primary" /> Class Average Attendance
                </div>
                <div className={`text-xl font-bold ${report.overall.percentage >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {report.overall.percentage}%
                </div>
              </div>
              <Progress value={report.overall.percentage} className="h-2" />
            </div>

            <div className="rounded-lg border border-border overflow-hidden max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sec</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.students.map((s: any) => (
                    <TableRow key={s.id} className={s.lowAttendance ? 'bg-rose-50 dark:bg-rose-950/20' : ''}>
                      <TableCell className="font-mono">{s.studentId}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell className="text-right text-emerald-600">{s.present}</TableCell>
                      <TableCell className="text-right text-rose-600">{s.absent}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.percentage >= 75 ? 'default' : 'destructive'}>
                          {s.percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">Select a subject to view report.</div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-muted-foreground">{icon}</span>
          </div>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
