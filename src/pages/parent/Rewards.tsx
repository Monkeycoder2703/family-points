import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import type { Reward } from '../../types'

export default function ParentRewards() {
  const { profile } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState(500)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', profile?.family_id)
      .order('created_at', { ascending: false })
    setRewards((data as Reward[]) ?? [])
  }

  useEffect(() => {
    if (profile?.family_id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id])

  async function addReward(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !profile?.family_id) return
    setSaving(true)
    await supabase.from('rewards').insert({
      family_id: profile.family_id,
      title,
      description: description || null,
      image_url: imageUrl || null,
      point_price: price,
    })
    setTitle('')
    setDescription('')
    setImageUrl('')
    setPrice(500)
    setSaving(false)
    load()
  }

  async function toggleActive(reward: Reward) {
    await supabase.from('rewards').update({ active: !reward.active }).eq('id', reward.id)
    load()
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-2">Belohnungen</h1>
      <p className="text-sm text-[var(--color-ink-soft)] mb-6">
        Der automatische Produktlink-Import (Bild/Titel/Preis auslesen) ist für Version 2.0 geplant – aktuell legst
        du Belohnungen manuell an, inkl. optionalem Bildlink.
      </p>

      <form onSubmit={addReward} className="grid sm:grid-cols-4 gap-2 mb-8">
        <input
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="sm:col-span-2 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <input
          type="number"
          min={0}
          placeholder="Punktepreis"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <input
          placeholder="Bild-URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <textarea
          placeholder="Beschreibung (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="sm:col-span-4 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <button
          disabled={saving}
          className="sm:col-span-4 rounded-full py-2.5 font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
        >
          Belohnung anlegen
        </button>
      </form>

      <div className="grid sm:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4"
          >
            <h3 className="font-display font-semibold">{r.title}</h3>
            <p className="ledger-figure text-[var(--color-coin)] font-semibold mt-1">{r.point_price} Pkt</p>
            <button
              onClick={() => toggleActive(r)}
              className={`mt-3 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                r.active
                  ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                  : 'border-[var(--color-ink-soft)] text-[var(--color-ink-soft)]'
              }`}
            >
              {r.active ? 'Aktiv' : 'Inaktiv'}
            </button>
          </div>
        ))}
      </div>
    </Layout>
  )
}
