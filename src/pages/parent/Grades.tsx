import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import type { Grade, GradePointRule, PointSetting, Subject } from '../../types'

export default function ParentGrades() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rules, setRules] = useState<GradePointRule[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjectName, setSubjectName] = useState('')
  const [subjectType, setSubjectType] = useState<'main' | 'minor'>('main')
  const [multiplier, setMultiplier] = useState(2)
  const [savingMultiplier, setSavingMultiplier] = useState(false)

  async function load() {
    if (!profile?.family_id) return
    const { data: s } = await supabase.from('subjects').select('*').eq('family_id', profile.family_id)
    setSubjects((s as Subject[]) ?? [])
    const { data: r } = await supabase.from('grade_point_rules').select('*').eq('family_id', profile.family_id)
    setRules((r as GradePointRule[]) ?? [])
    const { data: g } = await supabase
      .from('grades')
      .select('*, subject:subjects(*)')
      .order('date', { ascending: false })
      .limit(20)
    setGrades((g as unknown as Grade[]) ?? [])
    const { data: setting } = await supabase
      .from('point_settings')
      .select('*')
      .eq('family_id', profile.family_id)
      .single()
    if (setting) setMultiplier((setting as PointSetting).report_card_multiplier)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id])

  async function addSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectName.trim() || !profile?.family_id) return
    await supabase.from('subjects').insert({ family_id: profile.family_id, name: subjectName, type: subjectType })
    setSubjectName('')
    load()
  }

  async function updateRule(rule: GradePointRule, field: keyof GradePointRule, value: number) {
    await supabase.from('grade_point_rules').update({ [field]: value }).eq('id', rule.id)
    load()
  }

  async function saveMultiplier(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.family_id) return
    setSavingMultiplier(true)
    await supabase
      .from('point_settings')
      .update({ report_card_multiplier: multiplier })
      .eq('family_id', profile.family_id)
    setSavingMultiplier(false)
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Noten &amp; Punkteregeln</h1>

      <div className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4 mb-8">
        <h2 className="font-semibold mb-1">Zeugnisnoten</h2>
        <p className="text-sm text-[var(--color-ink-soft)] mb-3">
          Zeugnisnoten zählen mit diesem Multiplikator mehr Punkte als eine einzelne Note (Grundwert × Multiplikator,
          auf ganze Punkte gerundet).
        </p>
        <form onSubmit={saveMultiplier} className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            Multiplikator
            <input
              type="number"
              min={1}
              step={0.5}
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-20 rounded-lg border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-transparent px-2 py-1 ledger-figure"
            />
            ×
          </label>
          <button
            disabled={savingMultiplier}
            className="rounded-full px-4 py-1.5 text-sm font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
          >
            Speichern
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4"
          >
            <h2 className="font-semibold mb-3">{rule.subject_type === 'main' ? 'Hauptfächer' : 'Nebenfächer'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {([1, 2, 3, 4, 5, 6] as const).map((g) => {
                const field = `grade_${g}` as keyof GradePointRule
                return (
                  <label key={g} className="flex items-center gap-1">
                    Note {g}
                    <input
                      type="number"
                      value={rule[field] as number}
                      onChange={(e) => updateRule(rule, field, Number(e.target.value))}
                      className="w-16 rounded-lg border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-transparent px-1.5 py-1 ledger-figure"
                    />
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-3">Fächer</h2>
      <form onSubmit={addSubject} className="flex gap-2 mb-4">
        <input
          placeholder="Fach, z. B. Mathematik"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <select
          value={subjectType}
          onChange={(e) => setSubjectType(e.target.value as 'main' | 'minor')}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        >
          <option value="main">Hauptfach</option>
          <option value="minor">Nebenfach</option>
        </select>
        <button className="rounded-full px-4 py-2 font-semibold bg-[var(--color-parent)] text-white">
          Hinzufügen
        </button>
      </form>
      <div className="flex flex-wrap gap-2 mb-10">
        {subjects.map((s) => (
          <span
            key={s.id}
            className="text-sm px-3 py-1.5 rounded-full border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)]"
          >
            {s.name} · {s.type === 'main' ? 'Haupt' : 'Neben'}
          </span>
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-3">Zuletzt eingetragene Noten</h2>
      <div className="flex flex-col gap-2">
        {grades.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-3"
          >
            <span className="flex items-center gap-2">
              {g.subject?.name} · Note {g.grade_value} · {new Date(g.date).toLocaleDateString('de-DE')}
              {g.is_report_card && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-coin-soft)] text-[var(--color-ink)]">
                  Zeugnis
                </span>
              )}
            </span>
            <span className="ledger-figure font-semibold text-[var(--color-coin)]">
              {g.points_awarded > 0 ? '+' : ''}
              {g.points_awarded}
            </span>
          </div>
        ))}
      </div>
    </Layout>
  )
}
