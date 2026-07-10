import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { formatEuro } from '../../lib/points'
import type { PointSetting, Profile } from '../../types'

export default function ParentSettings() {
  const { profile } = useAuth()
  const [setting, setSetting] = useState<PointSetting | null>(null)
  const [pointsPerUnit, setPointsPerUnit] = useState(100)
  const [euroValue, setEuroValue] = useState(1)
  const [children, setChildren] = useState<Profile[]>([])
  const [adjustChild, setAdjustChild] = useState('')
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!profile?.family_id) return
    const { data: s } = await supabase
      .from('point_settings')
      .select('*')
      .eq('family_id', profile.family_id)
      .single()
    if (s) {
      setSetting(s as PointSetting)
      setPointsPerUnit((s as PointSetting).points_per_unit)
      setEuroValue((s as PointSetting).euro_value)
    }
    const { data: kids } = await supabase.from('profiles').select('*').eq('role', 'child')
    setChildren((kids as Profile[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id])

  async function saveSetting(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.family_id) return
    setSaving(true)
    await supabase
      .from('point_settings')
      .update({ points_per_unit: pointsPerUnit, euro_value: euroValue })
      .eq('family_id', profile.family_id)
    setSaving(false)
    load()
  }

  async function submitAdjustment(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustChild || adjustAmount === 0) return
    await supabase.rpc('adjust_points', {
      p_child_id: adjustChild,
      p_amount: adjustAmount,
      p_reason: adjustReason || 'Manuelle Anpassung',
    })
    setAdjustAmount(0)
    setAdjustReason('')
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Einstellungen</h1>

      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold mb-2">Euro-zu-Punkte-Umrechnung</h2>
        <p className="text-sm text-[var(--color-ink-soft)] mb-3">
          Wird überall in der App verwendet, z. B. für die Anzeige des Euro-Werts eines Punktestands.
        </p>
        <form onSubmit={saveSetting} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            Punkte
            <input
              type="number"
              min={1}
              value={pointsPerUnit}
              onChange={(e) => setPointsPerUnit(Number(e.target.value))}
              className="w-28 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2 mt-1"
            />
          </label>
          <span className="pb-2">=</span>
          <label className="flex flex-col text-sm">
            Euro
            <input
              type="number"
              min={0}
              step={0.01}
              value={euroValue}
              onChange={(e) => setEuroValue(Number(e.target.value))}
              className="w-28 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2 mt-1"
            />
          </label>
          <button
            disabled={saving}
            className="rounded-full px-5 py-2.5 font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
          >
            Speichern
          </button>
        </form>
        {setting && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-2">
            Aktuell: {setting.points_per_unit} Punkte = {formatEuro(setting.euro_value)}
          </p>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-2">Punkte manuell anpassen</h2>
        <form onSubmit={submitAdjustment} className="grid sm:grid-cols-4 gap-2">
          <select
            value={adjustChild}
            onChange={(e) => setAdjustChild(e.target.value)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          >
            <option value="">Kind wählen…</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="+/- Punkte"
            value={adjustAmount || ''}
            onChange={(e) => setAdjustAmount(Number(e.target.value))}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          />
          <input
            placeholder="Grund"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          />
          <button className="rounded-full px-4 py-2 font-semibold bg-[var(--color-ink)] text-white">
            Anwenden
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold mb-2">Familie wechseln</h2>
        <p className="text-sm text-[var(--color-ink-soft)] mb-3">
          Hat ein anderer Elternteil eurer Familie schon einen Account und möchte sich mit eurer gemeinsamen
          Familie verbinden (z. B. weil versehentlich eine eigene Familie angelegt wurde)? Auf der folgenden Seite
          kann er/sie einen Einladungscode eingeben.
        </p>
        <Link
          to="/parent/join-family"
          className="inline-block rounded-full px-4 py-2 font-semibold border border-[var(--color-ink)] dark:border-[var(--color-paper-dim)]"
        >
          Zur Seite „Familie wechseln"
        </Link>
      </section>
    </Layout>
  )
}
