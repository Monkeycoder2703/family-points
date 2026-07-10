import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import type { RepeatType, Task } from '../../types'

const suggestions = [
  { title: 'Zimmer aufräumen', points: 20 },
  { title: 'Geschirrspüler ausräumen', points: 10 },
  { title: 'Wäsche zusammenlegen', points: 15 },
  { title: 'Rasen mähen', points: 50 },
  { title: 'Auto waschen', points: 40 },
  { title: 'Einkaufen helfen', points: 25 },
]

export default function ParentTasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState(10)
  const [repeat, setRepeat] = useState<RepeatType>('once')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('family_id', profile?.family_id)
      .order('created_at', { ascending: false })
    setTasks((data as Task[]) ?? [])
  }

  useEffect(() => {
    if (profile?.family_id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id])

  async function addTask(e?: React.FormEvent) {
    e?.preventDefault()
    if (!title.trim() || !profile?.family_id) return
    setSaving(true)
    await supabase.from('tasks').insert({
      family_id: profile.family_id,
      title,
      points,
      repeat_type: repeat,
      category: category || null,
    })
    setTitle('')
    setPoints(10)
    setCategory('')
    setSaving(false)
    load()
  }

  async function toggleActive(task: Task) {
    await supabase.from('tasks').update({ active: !task.active }).eq('id', task.id)
    load()
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Aufgaben</h1>

      <form onSubmit={addTask} className="grid sm:grid-cols-5 gap-2 mb-8">
        <input
          placeholder="Titel, z. B. Zimmer aufräumen"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="sm:col-span-2 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <input
          placeholder="Kategorie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <input
          type="number"
          min={0}
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <select
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as RepeatType)}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        >
          <option value="once">Einmalig</option>
          <option value="daily">Täglich</option>
          <option value="weekly">Wöchentlich</option>
          <option value="monthly">Monatlich</option>
        </select>
        <button
          disabled={saving}
          className="sm:col-span-5 rounded-full py-2.5 font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
        >
          Aufgabe anlegen
        </button>
      </form>

      <div className="flex flex-col gap-2 mb-10">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4"
          >
            <div>
              <p className="font-semibold">{task.title}</p>
              <p className="text-xs text-[var(--color-ink-soft)] uppercase tracking-wide">
                {task.repeat_type} {task.category ? `· ${task.category}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="ledger-figure font-semibold text-[var(--color-coin)]">+{task.points}</span>
              <button
                onClick={() => toggleActive(task)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  task.active
                    ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                    : 'border-[var(--color-ink-soft)] text-[var(--color-ink-soft)]'
                }`}
              >
                {task.active ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-3">Punktevorschläge</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => {
              setTitle(s.title)
              setPoints(s.points)
            }}
            className="flex items-center justify-between rounded-xl border border-dashed border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] px-4 py-2.5 text-left hover:bg-[var(--color-paper-dim)]/40"
          >
            <span>{s.title}</span>
            <span className="ledger-figure text-[var(--color-coin)] font-semibold">{s.points} Pkt</span>
          </button>
        ))}
      </div>
    </Layout>
  )
}
