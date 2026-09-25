'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  CalendarDays,
  PieChart as PieChartIcon,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { api } from '@/lib/client/api'

interface Stats {
  totalStudents: number
  totalSubjects: number
  todayClassesCount: number
  overallSummary: {
    total: number
    present: number
    absent: number
    percentage: number
  }
  branches: { branch: string; count: number }[]
  subjects: { id: string; code: string; name: string; totalClasses: number; presentCount: number }[]
  lowAttendanceCount: number
  lowAttendanceStudents: {
    id: string
    studentId: string
    name: string
    present: number
    total: number
    percentage: number
  }[]
}

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<Stats>('/api/dashboard/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse h-32" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Failed to load dashboard.
        </CardContent>
      </Card>
    )
  }

  const cards = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      hint: `${stats.branches.length} branches`,
      tone: 'primary' as const,
    },
    {
      label: 'Total Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      hint: 'Across all branches',
      tone: 'primary' as const,
    },
    {
      label: "Today's Classes",
      value: stats.todayClassesCount,
      icon: CalendarDays,
      hint: 'Subjects with attendance marked today',
      tone: 'primary' as const,
    },
    {
      label: 'Low Attendance Alerts',
      value: stats.lowAttendanceCount,
      icon: AlertTriangle,
      hint: 'Students below 75% threshold',
      tone: stats.lowAttendanceCount > 0 ? 'destructive' : 'primary',
    },
  ]

  const pieData = [
    { name: 'Present', value: stats.overallSummary.present },
    { name: 'Absent', value: stats.overallSummary.absent },
  ]
  const pieColors = ['var(--chart-1)', 'var(--chart-4)']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time overview of attendance, students, and at-risk alerts.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.tone === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                      <Icon className={`w-5 h-5 ${c.tone === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.hint}</Badge>
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Overall attendance summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Overall Attendance Summary
            </CardTitle>
            <CardDescription>
              Across all subjects and students in the institution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">
                  {stats.overallSummary.percentage}%
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>{stats.overallSummary.present} present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>{stats.overallSummary.absent} absent</span>
                  </div>
                </div>
                <Progress value={stats.overallSummary.percentage} className="mt-3 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Threshold for warning: <strong>75%</strong>. Currently{' '}
                  {stats.overallSummary.percentage >= 75 ? 'above' : 'below'} threshold.
                </p>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Students by Branch</CardTitle>
            <CardDescription>Distribution across departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.branches}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low attendance students + subject breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              At-Risk Students (Below 75%)
            </CardTitle>
            <CardDescription>
              {stats.lowAttendanceStudents.length === 0
                ? 'No students below 75% — great job!'
                : `Showing top ${Math.min(stats.lowAttendanceStudents.length, 10)} most at-risk.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowAttendanceStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No students require intervention at this time.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowAttendanceStudents.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.studentId}</div>
                      </TableCell>
                      <TableCell className="text-right">{s.present}</TableCell>
                      <TableCell className="text-right">{s.total}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.percentage < 50 ? 'destructive' : 'secondary'}>
                          {s.percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Summary</CardTitle>
            <CardDescription>Total classes & present counts per subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto pr-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Classes</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.subjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.code}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[140px]">{s.name}</div>
                      </TableCell>
                      <TableCell className="text-right">{s.totalClasses}</TableCell>
                      <TableCell className="text-right">{s.presentCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
