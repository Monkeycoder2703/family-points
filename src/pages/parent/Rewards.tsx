import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { fetchProductInfo } from '../../lib/productImport'
import { euroToPoints, formatEuro } from '../../lib/points'
import type { PointSetting, Reward } from '../../types'

export default function ParentRewards() {
  const { profile } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [setting, setSetting] = useState<PointSetting | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState(500)
  const [priceEuroInput, setPriceEuroInput] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const [productUrl, setProductUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedPriceEuro, setImportedPriceEuro] = useState<number | null>(null)

  async function load() {
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', profile?.family_id)
      .order('created_at', { ascending: false })
    setRewards((data as Reward[]) ?? [])

    const { data: s } = await supabase
      .from('point_settings')
      .select('*')
      .eq('family_id', profile?.family_id)
      .single()
    setSetting((s as PointSetting) ?? null)
  }

  useEffect(() => {
    if (profile?.family_id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.family_id])

  function handleEuroChange(raw: string) {
    setPriceEuroInput(raw)
    const euro = parseFloat(raw.replace(',', '.'))
    if (!Number.isNaN(euro) && setting) {
      setPrice(euroToPoints(euro, setting))
    }
  }

  async function importFromUrl(e: React.FormEvent) {
    e.preventDefault()
    if (!productUrl.trim()) return
    setImporting(true)
    setImportError(null)
    setImportedPriceEuro(null)
    try {
      const info = await fetchProductInfo(productUrl.trim())
      if (info.title) setTitle(info.title)
      if (info.description) setDescription(info.description)
      if (info.imageUrl) setImageUrl(info.imageUrl)
      if (info.priceEuro !== undefined && setting) {
        setPrice(euroToPoints(info.priceEuro, setting))
        setPriceEuroInput(String(info.priceEuro))
        setImportedPriceEuro(info.priceEuro)
      }
      if (!info.title && !info.imageUrl && info.priceEuro === undefined) {
        setImportError(
          'Auf dieser Seite konnten keine Produktdaten gefunden werden. Bitte Titel, Bild und Preis unten manuell eintragen.'
        )
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    } finally {
      setImporting(false)
    }
  }

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
    setPriceEuroInput('')
    setProductUrl('')
    setImportedPriceEuro(null)
    setImportError(null)
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
        Belohnung manuell anlegen oder per Produktlink automatisch Titel, Bild und Preis auslesen lassen. Das
        klappt bei den meisten Shops, aber nicht bei jedem – alle Felder bleiben danach bearbeitbar.
      </p>

      <form onSubmit={importFromUrl} className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="url"
          placeholder="Produktlink einfügen, z. B. https://shop.de/produkt/1234"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <button
          disabled={importing || !productUrl.trim()}
          className="rounded-full px-4 py-2 font-semibold bg-[var(--color-ink)] text-white dark:text-[var(--color-bg-dark)] disabled:opacity-50 whitespace-nowrap"
        >
          {importing ? 'Lese Seite aus…' : 'Link auslesen'}
        </button>
      </form>
      {importError && <p className="text-sm text-[var(--color-clay)] mb-3">{importError}</p>}
      {importedPriceEuro !== null && setting && (
        <p className="text-sm text-[var(--color-sage)] mb-3">
          Preis erkannt: {formatEuro(importedPriceEuro)} → {price.toLocaleString('de-DE')} Punkte (bei{' '}
          {setting.points_per_unit} Punkte = {formatEuro(setting.euro_value)}). Titel, Bild und Beschreibung wurden
          unten befüllt – bitte kurz prüfen.
        </p>
      )}

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
          step={0.01}
          placeholder="Preis in € (optional)"
          value={priceEuroInput}
          onChange={(e) => handleEuroChange(e.target.value)}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        <input
          type="number"
          min={0}
          placeholder="Punktepreis"
          value={price}
          onChange={(e) => {
            setPrice(Number(e.target.value))
            setPriceEuroInput('')
          }}
          className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        {setting && priceEuroInput && (
          <p className="sm:col-span-4 text-xs text-[var(--color-ink-soft)] -mt-1">
            {priceEuroInput.replace(',', '.')} € → {price.toLocaleString('de-DE')} Punkte (bei {setting.points_per_unit}{' '}
            Punkte = {formatEuro(setting.euro_value)}). Du kannst die Punktzahl rechts trotzdem noch manuell anpassen.
          </p>
        )}
        <input
          placeholder="Bild-URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="sm:col-span-4 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
        />
        {imageUrl && (
          <div className="sm:col-span-4 flex items-center gap-3">
            <img
              src={imageUrl}
              alt="Vorschau"
              className="w-16 h-16 rounded-lg object-cover border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)]"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span className="text-xs text-[var(--color-ink-soft)]">Bildvorschau</span>
          </div>
        )}
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
