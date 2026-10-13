'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Video,
  FileText,
  GraduationCap,
  Newspaper,
  Wrench,
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

interface Resource {
  id: string
  title: string
  type: string
  url: string
  description: string | null
  isFree: boolean
  subjectId: string
  subject: { code: string; name: string }
}

const TYPE_ICONS: Record<string, any> = {
  video: Video,
  pdf: FileText,
  course: GraduationCap,
  article: Newspaper,
  book: BookOpen,
  tool: Wrench,
}

const TYPES = ['video', 'pdf', 'course', 'article', 'book', 'tool']

export function ResourcesView() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string>('all')

  // Form state
  const [form, setForm] = useState({
    subjectId: '',
    title: '',
    type: 'video',
    url: '',
    description: '',
  })
  const [busy, setBusy] = useState(false)

  async function loadSubjects() {
    const r = await api<{ subjects: Subject[] }>('/api/subjects')
    setSubjects(r.subjects)
    if (r.subjects[0] && !form.subjectId) {
      setForm((f) => ({ ...f, subjectId: r.subjects[0].id }))
    }
  }

  async function loadResources() {
    setLoading(true)
    const url = filterSubject === 'all' ? '/api/resources' : `/api/resources?subjectId=${filterSubject}`
    const r = await api<{ resources: Resource[] }>(url)
    setResources(r.resources)
    setLoading(false)
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    loadResources()
  }, [filterSubject])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.subjectId || !form.title || !form.url) {
      toast.error('Subject, title, and URL are required')
      return
    }
    setBusy(true)
    try {
      await api('/api/resources', {
        method: 'POST',
        body: JSON.stringify({ ...form, isFree: true }),
      })
      toast.success('Resource added')
      setForm({ subjectId: form.subjectId, title: '', type: 'video', url: '', description: '' })
      loadResources()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await api(`/api/resources/${id}`, { method: 'DELETE' })
      toast.success('Resource deleted')
      loadResources()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Study Resources
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage free study materials (videos, PDFs, courses, articles) for each subject.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Resource</CardTitle>
            <CardDescription>Link a free study resource to a subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Resource Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="NPTEL: Data Structures & Algorithms"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cost</Label>
                  <Badge variant="secondary" className="h-10 flex items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    FREE
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>URL *</Label>
                <Input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://nptel.ac.in/..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description (optional)"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                <Plus className="w-4 h-4 mr-1" />
                Add Resource
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>Resources ({resources.length})</span>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
            <CardDescription>Students can browse these in their Study Resources tab.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : resources.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No resources yet. Add one using the form on the left.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                {resources.map((r) => {
                  const Icon = TYPE_ICONS[r.type] || BookOpen
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/30"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm hover:underline truncate"
                          >
                            {r.title}
                          </a>
                          <Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge>
                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">FREE</Badge>
                        </div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                          {r.subject.code} — {r.subject.name}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label="Open">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(r.id, r.title)} aria-label="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
