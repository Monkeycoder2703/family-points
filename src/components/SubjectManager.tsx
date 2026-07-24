import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Subject, SubjectType } from '../types'

export function SubjectManager({
  subjects,
  familyId,
  accentColor,
  onChange,
}: {
  subjects: Subject[]
  familyId: string
  accentColor: string
  onChange: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<SubjectType>('main')
  const [adding, setAdding] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState<SubjectType>('main')
  const [savingEdit, setSavingEdit] = useState(false)

  async function addSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    await supabase.from('subjects').insert({ family_id: familyId, name: name.trim(), type })
    setName('')
    setAdding(false)
    onChange()
  }

  function startEdit(s: Subject) {
    setEditingId(s.id)
    setEditName(s.name)
    setEditType(s.type)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setSavingEdit(true)
    await supabase.from('subjects').update({ name: editName.trim(), type: editType }).eq('id', id)
    setSavingEdit(false)
    setEditingId(null)
    onChange()
  }

  async function deleteSubject(s: Subject) {
    const confirmed = window.confirm(
      `„${s.name}" wirklich löschen?\n\nDamit verschwinden auch alle bisherigen Noten in diesem Fach (bereits gutgeschriebene Punkte bleiben davon unberührt).`
    )
    if (!confirmed) return
    await supabase.from('subjects').delete().eq('id', s.id)
    if (editingId === s.id) setEditingId(null)
    onChange()
  }

  return (
    <div>
      <form onSubmit={addSubject} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          placeholder="Fach, z. B. Mathematik"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full sm:flex-1 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as SubjectType)}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        >
          <option value="main">Hauptfach</option>
          <option value="minor">Nebenfach</option>
        </select>
        <button
          disabled={adding}
          className="rounded-full px-4 py-2 font-semibold text-white disabled:opacity-50"
          style={{ background: accentColor }}
        >
          Hinzufügen
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {subjects.map((s) =>
          editingId === s.id ? (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row gap-2 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] p-2"
            >
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full sm:flex-1 rounded-lg border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-2 py-1.5"
              />
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as SubjectType)}
                className="rounded-lg border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-2 py-1.5"
              >
                <option value="main">Hauptfach</option>
                <option value="minor">Nebenfach</option>
              </select>
              <div className="flex gap-2">
                <button
                  disabled={savingEdit}
                  onClick={() => saveEdit(s.id)}
                  className="flex-1 sm:flex-none rounded-full px-3 py-1.5 text-sm font-semibold bg-[var(--color-sage)] text-white disabled:opacity-50"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 sm:flex-none rounded-full px-3 py-1.5 text-sm font-semibold border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)]"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] px-3 py-2 text-sm"
            >
              <span>
                {s.name} · {s.type === 'main' ? 'Haupt' : 'Neben'}
              </span>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(s)} className="text-xs font-semibold underline">
                  Bearbeiten
                </button>
                <button
                  onClick={() => deleteSubject(s)}
                  className="text-xs font-semibold underline text-[var(--color-clay)]"
                >
                  Löschen
                </button>
              </div>
            </div>
          )
        )}
        {subjects.length === 0 && <p className="text-sm text-[var(--color-ink-soft)]">Noch keine Fächer angelegt.</p>}
      </div>
    </div>
  )
}
