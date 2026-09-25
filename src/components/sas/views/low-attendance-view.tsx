'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  Book,
  ShieldAlert,
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

interface LowAttendanceStudent {
  id: string
  studentId: string
  name: string
  branch: string
  section: string
  semester: number
  email: string | null
  phone: string | null
  present: number
  total: number
  percentage: number
  lowSubjects: {
    code: string
    name: string
    present: number
    total: number
    percentage: number
  }[]
}

export function LowAttendanceView() {
  const [students, setStudents] = useState<LowAttendanceStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ students: LowAttendanceStudent[]; count: number }>('/api/reports/low-attendance')
      .then((r) => setStudents(r.students))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          Low Attendance Warnings
        </h1>
        <p className="text-sm text-muted-foreground">
          Students below the <strong>75% threshold</strong> with subject-level breakdowns. Triggered automatically.
        </p>
      </div>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">Active warnings: {students.length}</div>
            <div className="text-xs text-muted-foreground">
              According to institution policy, attendance below 75% disqualifies students from sitting final exams. Send notifications and remediation plans.
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading low-attendance students…
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="font-medium">No students below 75%</div>
            <div className="text-sm text-muted-foreground">All students meet the minimum attendance requirement.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {students.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
            >
              <Card className={s.percentage < 50 ? 'border-destructive/40' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {s.studentId} • {s.branch} / Sec {s.section} / Sem {s.semester}
                      </div>
                    </div>
                    <Badge variant={s.percentage < 50 ? 'destructive' : 'secondary'}>
                      {s.percentage}%
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{s.present} / {s.total} classes attended</span>
                    </div>
                    <Progress value={s.percentage} className="h-1.5" />
                  </div>

                  {s.lowSubjects.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Book className="w-3.5 h-3.5 text-destructive" />
                        Low subjects ({s.lowSubjects.length}):
                      </div>
                      {s.lowSubjects.map((subj, j) => (
                        <div key={j} className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1">
                          <span>{subj.code} — {subj.name}</span>
                          <span className="font-mono text-destructive">{subj.present}/{subj.total} ({subj.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
                    {s.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {s.email}
                      </span>
                    )}
                    {s.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {s.phone}
                      </span>
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
