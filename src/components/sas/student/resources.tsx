'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Loader2,
  ExternalLink,
  Video,
  FileText,
  GraduationCap,
  Newspaper,
  Wrench,
  Search,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

export function StudentResources() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState<string>('all')

  useEffect(() => {
    api<{ resources: Resource[] }>('/api/resources')
      .then((r) => setResources(r.resources))
      .finally(() => setLoading(false))
  }, [])

  // Get unique subjects for filter
  const subjects = Array.from(
    new Map(resources.map((r) => [r.subjectId, r.subject])).values(),
  )

  const filtered = resources.filter((r) => {
    if (filterSubject !== 'all' && r.subjectId !== filterSubject) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        r.subject.code.toLowerCase().includes(q) ||
        r.subject.name.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Group by subject
  const grouped = filtered.reduce((acc, r) => {
    const key = r.subject.code
    if (!acc[key]) acc[key] = { subject: r.subject, items: [] }
    acc[key].items.push(r)
    return acc
  }, {} as Record<string, { subject: Resource['subject']; items: Resource[] }>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Study Resources
        </h1>
        <p className="text-sm text-muted-foreground">
          Free study materials for your enrolled subjects. Click any resource to open in a new tab.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search &amp; Filter</CardTitle>
          <CardDescription>{resources.length} resources available across {subjects.length} subjects.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-56"><SelectValue placeholder="All subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.code} value={resources.find((r) => r.subject.code === s.code)?.subjectId || ''}>
                  {s.code} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading resources…
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No resources match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([code, group]) => (
            <Card key={code}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge variant="outline">{group.subject.code}</Badge>
                  <span className="text-sm font-normal text-muted-foreground">{group.subject.name}</span>
                </CardTitle>
                <CardDescription>{group.items.length} resource{group.items.length === 1 ? '' : 's'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {group.items.map((r) => {
                    const Icon = TYPE_ICONS[r.type] || BookOpen
                    return (
                      <motion.a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="block p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{r.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                            </div>
                            {r.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {r.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge>
                              <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">FREE</Badge>
                            </div>
                          </div>
                        </div>
                      </motion.a>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
