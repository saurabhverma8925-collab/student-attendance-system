'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Percent,
  BookOpen,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { api } from '@/lib/client/api'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/store/app-store'

interface Report {
  student: {
    id: string
    studentId: string
    name: string
    branch: string
    section: string
    semester: number
  }
  subjects: {
    subjectId: string
    code: string
    name: string
    totalClasses: number
    present: number
    absent: number
    percentage: number
    lowAttendance: boolean
  }[]
  overall: {
    totalClasses: number
    present: number
    absent: number
    percentage: number
    lowAttendance: boolean
  }
}

export function StudentDashboard() {
  const { user } = useAppStore()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Report>('/api/reports/student')
      .then(setReport)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading your attendance…
      </div>
    )
  }

  if (!report) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">Failed to load report.</CardContent></Card>
  }

  const lowCount = report.subjects.filter((s) => s.lowAttendance).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Your subject-wise attendance for Semester {report.student.semester}.
        </p>
      </div>

      {report.overall.lowAttendance && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-destructive shrink-0" />
              <div>
                <div className="font-semibold text-destructive">
                  Low attendance warning — {report.overall.percentage}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Your overall attendance is below the mandatory 75% threshold. Improve attendance in {lowCount} subject{lowCount === 1 ? '' : 's'} to avoid exam disqualification.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Classes"
          value={report.overall.totalClasses}
          icon={<BookOpen className="w-4 h-4" />}
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
        <SummaryCard
          label="Overall %"
          value={`${report.overall.percentage}%`}
          icon={<Percent className="w-4 h-4 text-primary" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Attendance</CardTitle>
          <CardDescription>
            {report.overall.percentage >= 75
              ? 'You are above the 75% threshold — keep it up!'
              : 'You are below the 75% threshold — attendance at risk.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className={`text-2xl font-bold ${report.overall.percentage >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
              {report.overall.percentage}%
            </span>
          </div>
          <Progress value={report.overall.percentage} className="h-3" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0%</span>
            <span className="font-medium text-amber-600">75% (threshold)</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance</CardTitle>
          <CardDescription>Detailed breakdown of each subject.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.subjects.map((s) => (
                  <TableRow key={s.subjectId} className={s.lowAttendance ? 'bg-rose-50 dark:bg-rose-950/20' : ''}>
                    <TableCell>
                      <div className="font-medium">{s.code}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">{s.name}</div>
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">{s.present}</TableCell>
                    <TableCell className="text-right text-rose-600">{s.absent}</TableCell>
                    <TableCell className="text-right">{s.totalClasses}</TableCell>
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
        </CardContent>
      </Card>

      <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-800 dark:text-emerald-200">
            <strong>Privacy note:</strong> Your fingerprint template is stored as a one-way hash — raw biometric data never leaves your device. The system can verify but cannot reconstruct your fingerprint.
          </div>
        </CardContent>
      </Card>
    </div>
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
