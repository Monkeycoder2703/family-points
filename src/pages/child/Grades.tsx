import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import type { Grade, Subject } from '../../types'

export default function ChildGrades() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [gradeValue, setGradeValue] = useState(2)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    if (!profile) return
    const { data: s } = await supabase.from('subjects').select('*').order('name')
    setSubjects((s as Subject[]) ?? [])
    const { data: g } = await supabase
      .from('grades')
      .select('*, subject:subjects(*)')
      .eq('child_id', profile.id)
      .order('date', { ascending: false })
    setGrades((g as unknown as Grade[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function submitGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId || !profile) return
    setMessage(null)
    const { error } = await supabase.rpc('submit_grade', {
      p_child_id: profile.id,
      p_subject_id: subjectId,
      p_grade_value: gradeValue,
      p_date: date,
    })
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Note gespeichert!')
    load()
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Noten</h1>

      <form onSubmit={submitGrade} className="grid sm:grid-cols-4 gap-2 mb-8">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          required
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        >
          <option value="">Fach wählen…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          step={0.1}
          min={1}
          max={6}
          value={gradeValue}
          onChange={(e) => setGradeValue(Number(e.target.value))}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <button className="rounded-full px-4 py-2 font-semibold bg-[var(--color-child)] text-white">
          Note eintragen
        </button>
      </form>
      {message && <p className="mb-6 text-sm font-semibold text-[var(--color-sage)]">{message}</p>}

      <div className="flex flex-col gap-2">
        {grades.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-3"
          >
            <span>
              {g.subject?.name} · Note {g.grade_value} · {new Date(g.date).toLocaleDateString('de-DE')}
            </span>
            <span
              className={`ledger-figure font-semibold ${
                g.points_awarded >= 0 ? 'text-[var(--color-sage)]' : 'text-[var(--color-clay)]'
              }`}
            >
              {g.points_awarded > 0 ? '+' : ''}
              {g.points_awarded}
            </span>
          </div>
        ))}
      </div>
    </Layout>
  )
}
