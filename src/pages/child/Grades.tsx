import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { recognizeReportCardImage, type OcrGuess } from '../../lib/gradeOcr'
import type { Grade, Subject } from '../../types'

const statusLabels: Record<string, { text: string; className: string }> = {
  pending: { text: 'Wartet auf Bestätigung', className: 'bg-[var(--color-coin-soft)] text-[var(--color-ink)]' },
  approved: { text: 'Bestätigt', className: 'bg-[var(--color-sage-soft)] text-[var(--color-sage)]' },
  rejected: { text: 'Abgelehnt', className: 'bg-[var(--color-clay-soft)] text-[var(--color-clay)]' },
}

function guessSubjectId(subjects: Subject[], guess: string): string {
  const lower = guess.toLowerCase()
  const match = subjects.find(
    (s) => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase())
  )
  return match?.id ?? ''
}

export default function ChildGrades() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [gradeValue, setGradeValue] = useState(2)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isReportCard, setIsReportCard] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectType, setNewSubjectType] = useState<'main' | 'minor'>('main')
  const [addingSubject, setAddingSubject] = useState(false)

  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [ocrGuesses, setOcrGuesses] = useState<OcrGuess[]>([])
  const [ocrSubjectChoice, setOcrSubjectChoice] = useState<Record<string, string>>({})
  const [ocrGradeChoice, setOcrGradeChoice] = useState<Record<string, number>>({})
  const [ocrSubmittingId, setOcrSubmittingId] = useState<string | null>(null)

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
      p_is_report_card: isReportCard,
    })
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Eingetragen! Wartet jetzt auf Bestätigung durch ein Elternteil.')
    setIsReportCard(false)
    load()
  }

  async function addSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubjectName.trim() || !profile?.family_id) return
    setAddingSubject(true)
    await supabase
      .from('subjects')
      .insert({ family_id: profile.family_id, name: newSubjectName.trim(), type: newSubjectType })
    setNewSubjectName('')
    setAddingSubject(false)
    load()
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setOcrBusy(true)
    setOcrError(null)
    setOcrProgress(0)
    setOcrGuesses([])
    try {
      const guesses = await recognizeReportCardImage(file, setOcrProgress)
      if (guesses.length === 0) {
        setOcrError('Auf dem Foto konnte kein Text erkannt werden. Versuch ein schärferes, gerade ausgerichtetes Foto.')
      }
      setOcrGuesses(guesses)
      const subjectChoices: Record<string, string> = {}
      const gradeChoices: Record<string, number> = {}
      for (const g of guesses) {
        subjectChoices[g.id] = guessSubjectId(subjects, g.subjectGuess)
        gradeChoices[g.id] = g.gradeGuess ?? 2
      }
      setOcrSubjectChoice(subjectChoices)
      setOcrGradeChoice(gradeChoices)
    } catch (err) {
      setOcrError(
        err instanceof Error
          ? `Texterkennung fehlgeschlagen: ${err.message}`
          : 'Texterkennung fehlgeschlagen. Bitte Noten in dem Fall manuell eintragen.'
      )
    } finally {
      setOcrBusy(false)
    }
  }

  async function submitOcrRow(guess: OcrGuess) {
    const subjId = ocrSubjectChoice[guess.id]
    const gradeVal = ocrGradeChoice[guess.id]
    if (!subjId || !profile) return
    setOcrSubmittingId(guess.id)
    const { error } = await supabase.rpc('submit_grade', {
      p_child_id: profile.id,
      p_subject_id: subjId,
      p_grade_value: gradeVal,
      p_date: date,
      p_is_report_card: true,
    })
    setOcrSubmittingId(null)
    if (error) {
      setOcrError(error.message)
      return
    }
    setOcrGuesses((prev) => prev.filter((g) => g.id !== guess.id))
    load()
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Noten</h1>

      <form onSubmit={submitGrade} className="grid sm:grid-cols-4 gap-2 mb-2">
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
      <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={isReportCard}
          onChange={(e) => setIsReportCard(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-coin)]"
        />
        Das ist eine Zeugnisnote (zählt mehr Punkte)
      </label>
      {message && <p className="mb-6 text-sm font-semibold text-[var(--color-sage)]">{message}</p>}

      <div className="rounded-2xl border border-dashed border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] p-4 mb-8">
        <h2 className="font-semibold mb-1">Eigenes Fach hinzufügen</h2>
        <p className="text-sm text-[var(--color-ink-soft)] mb-3">
          Fehlt ein Fach in der Liste oben? Leg es hier selbst an.
        </p>
        <form onSubmit={addSubject} className="flex flex-wrap gap-2">
          <input
            placeholder="Fach, z. B. Erdkunde"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 min-w-[10rem] rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          />
          <select
            value={newSubjectType}
            onChange={(e) => setNewSubjectType(e.target.value as 'main' | 'minor')}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          >
            <option value="main">Hauptfach</option>
            <option value="minor">Nebenfach</option>
          </select>
          <button
            disabled={addingSubject}
            className="rounded-full px-4 py-2 font-semibold bg-[var(--color-child)] text-white disabled:opacity-50"
          >
            Hinzufügen
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4 mb-10">
        <h2 className="font-semibold mb-1">📸 Zeugnis per Foto einlesen</h2>
        <p className="text-sm text-[var(--color-ink-soft)] mb-3">
          Texterkennung ist nie perfekt – nach dem Einlesen kannst du Fach und Note für jede Zeile prüfen und
          korrigieren, bevor etwas gespeichert wird.
        </p>
        <label className="inline-block rounded-full px-4 py-2 font-semibold bg-[var(--color-ink)] text-white dark:text-[var(--color-bg-dark)] cursor-pointer">
          Foto auswählen…
          <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        </label>

        {ocrBusy && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-3">Lese Text aus dem Foto… {ocrProgress}%</p>
        )}
        {ocrError && <p className="text-sm text-[var(--color-clay)] mt-3">{ocrError}</p>}

        {ocrGuesses.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {ocrGuesses.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] p-3"
              >
                <p className="text-xs text-[var(--color-ink-soft)] mb-2">Erkannt: „{g.rawLine}"</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={ocrSubjectChoice[g.id] ?? ''}
                    onChange={(e) => setOcrSubjectChoice((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="rounded-lg border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-2 py-1.5 text-sm"
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
                    value={ocrGradeChoice[g.id] ?? 2}
                    onChange={(e) =>
                      setOcrGradeChoice((prev) => ({ ...prev, [g.id]: Number(e.target.value) }))
                    }
                    className="w-20 rounded-lg border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-2 py-1.5 text-sm ledger-figure"
                  />
                  <button
                    disabled={!ocrSubjectChoice[g.id] || ocrSubmittingId === g.id}
                    onClick={() => submitOcrRow(g)}
                    className="rounded-full px-4 py-1.5 text-sm font-semibold bg-[var(--color-child)] text-white disabled:opacity-50"
                  >
                    {ocrSubmittingId === g.id ? 'Speichert…' : 'Übernehmen'}
                  </button>
                  <button
                    onClick={() => setOcrGuesses((prev) => prev.filter((x) => x.id !== g.id))}
                    className="text-xs text-[var(--color-ink-soft)] underline"
                  >
                    Verwerfen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {grades.map((g) => {
          const status = statusLabels[g.status] ?? statusLabels.approved
          return (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-3"
            >
              <span className="flex flex-wrap items-center gap-2">
                {g.subject?.name} · Note {g.grade_value} · {new Date(g.date).toLocaleDateString('de-DE')}
                {g.is_report_card && (
                  <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-coin-soft)] text-[var(--color-ink)]">
                    Zeugnis
                  </span>
                )}
                <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${status.className}`}>
                  {status.text}
                </span>
              </span>
              {g.status !== 'pending' && (
                <span
                  className={`ledger-figure font-semibold ${
                    g.points_awarded >= 0 ? 'text-[var(--color-sage)]' : 'text-[var(--color-clay)]'
                  }`}
                >
                  {g.points_awarded > 0 ? '+' : ''}
                  {g.points_awarded}
                </span>
              )}
            </div>
          )
        })}
        {grades.length === 0 && <p className="text-[var(--color-ink-soft)]">Noch keine Noten eingetragen.</p>}
      </div>
    </Layout>
  )
}
