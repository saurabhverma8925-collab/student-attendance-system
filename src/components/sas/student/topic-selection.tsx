'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  BookOpen,
  Search,
  Loader2,
  Lightbulb,
} from 'lucide-react'
import { api } from '@/lib/client/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export function TopicSelectionView() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [selected, setSelected] = useState<Topic | null>(null)

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

  const grouped = topics.reduce<Record<string, Topic[]>>((acc, t) => {
    ;(acc[t.category] = acc[t.category] || []).push(t)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Topic Selection</h1>
        <p className="text-sm text-muted-foreground">
          Browse 70 preset Java project topics, or propose a custom topic to your faculty.
        </p>
      </div>

      {/* Info banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Propose a Custom Topic</div>
            <p className="text-xs text-muted-foreground mt-1">
              If none of the preset topics fit your interest, you can propose your own topic
              during Review 0 submission. Faculty will approve or reject it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics…"
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
                    <Card
                      className="h-full cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
                      onClick={() => setSelected(t)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm leading-snug line-clamp-2">
                          {t.title}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-3">
                          {t.description || 'No description provided.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge
                          variant="outline"
                          className={`text-[9px] border ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.General}`}
                        >
                          {t.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className={`text-[10px] border ${selected ? CATEGORY_COLORS[selected.category] || CATEGORY_COLORS.General : ''}`}
              >
                {selected?.category}
              </Badge>
            </div>
            <DialogTitle className="text-base leading-snug">{selected?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {selected?.description || 'No description provided.'}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            To work on this topic, head to <strong>My Reviews → Review 0</strong> and submit it
            as your project title. Faculty will approve or ask you to revise.
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
