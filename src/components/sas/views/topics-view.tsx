'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  Search,
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Topic {
  id: string
  title: string
  description: string
  category: string
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'GUI', label: 'GUI' },
  { id: 'Web', label: 'Web' },
  { id: 'Database', label: 'Database' },
  { id: 'Network', label: 'Network' },
  { id: 'AI/ML', label: 'AI/ML' },
  { id: 'Game', label: 'Game' },
  { id: 'General', label: 'General' },
] as const

const CATEGORY_COLORS: Record<string, string> = {
  GUI: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  Web: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
  Database: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  Network: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  'AI/ML': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  Game: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  General: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
}

export function TopicsView() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  // add form
  const [ntTitle, setNtTitle] = useState('')
  const [ntDesc, setNtDesc] = useState('')
  const [ntCat, setNtCat] = useState('General')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      const r = await api<{ topics: Topic[]; count: number }>(
        `/api/topics?${params.toString()}`,
      )
      setTopics(r.topics)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [search, category])

  async function addTopic() {
    if (!ntTitle.trim()) return toast.error('Title is required')
    setBusy('add')
    try {
      await api('/api/topics', {
        method: 'POST',
        body: JSON.stringify({
          title: ntTitle,
          description: ntDesc,
          category: ntCat,
        }),
      })
      toast.success('Topic added')
      setAddOpen(false)
      setNtTitle('')
      setNtDesc('')
      setNtCat('General')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  async function deleteTopic(topic: Topic) {
    if (!confirm(`Delete topic "${topic.title}"?`)) return
    setBusy(`del:${topic.id}`)
    try {
      await api(`/api/topics/${topic.id}`, { method: 'DELETE' })
      toast.success('Topic deleted')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  // Group topics by category
  const grouped = topics.reduce<Record<string, Topic[]>>((acc, t) => {
    ;(acc[t.category] = acc[t.category] || []).push(t)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Preset Topics</h1>
          <p className="text-sm text-muted-foreground">
            70 suggested project topics across 7 categories.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add a new preset topic</DialogTitle>
              <DialogDescription>
                Topics are visible to all students in the topic selection screen.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nt-title">Title</Label>
                <Input
                  id="nt-title"
                  value={ntTitle}
                  onChange={(e) => setNtTitle(e.target.value)}
                  placeholder="e.g. Hospital Management System"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nt-desc">Description</Label>
                <Textarea
                  id="nt-desc"
                  value={ntDesc}
                  onChange={(e) => setNtDesc(e.target.value)}
                  placeholder="Short description of the project scope, features, and required tech."
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={ntCat} onValueChange={setNtCat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={busy === 'add'}>
                Cancel
              </Button>
              <Button onClick={addTopic} disabled={busy === 'add'}>
                {busy === 'add' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Add Topic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics by title…"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-56 w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading topics…
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No topics match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className={`text-[10px] border ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.General}`}
                >
                  {cat}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {list.length} topic{list.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm leading-snug line-clamp-2">
                          {t.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-3">
                          {t.description || 'No description provided.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8"
                          onClick={() => deleteTopic(t)}
                          disabled={busy === `del:${t.id}`}
                        >
                          {busy === `del:${t.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                          )}
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
