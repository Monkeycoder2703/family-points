import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { fetchProductInfo } from '../../lib/productImport'
import { euroToPoints, formatEuro } from '../../lib/points'
import { rewardLimitLabels } from '../../lib/taskPeriods'
import type { PointSetting, Reward, RewardLimit } from '../../types'

export default function ParentRewards() {
  const { profile } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [setting, setSetting] = useState<PointSetting | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState(500)
  const [priceEuroInput, setPriceEuroInput] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [redeemLimit, setRedeemLimit] = useState<RewardLimit>('unlimited')
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

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setImageUrl('')
    setImagePreview('')
    setImageUploadError(null)
    setPrice(500)
    setPriceEuroInput('')
    setRedeemLimit('unlimited')
    setProductUrl('')
    setImportedPriceEuro(null)
    setImportError(null)
  }

  function startEdit(reward: Reward) {
    setEditingId(reward.id)
    setTitle(reward.title)
    setDescription(reward.description ?? '')
    setImageUrl(reward.image_url ?? '')
    setImagePreview('')
    setImageUploadError(null)
    setPrice(reward.point_price)
    setPriceEuroInput('')
    setRedeemLimit(reward.redeem_limit)
    setImportedPriceEuro(null)
    setImportError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleEuroChange(raw: string) {
    setPriceEuroInput(raw)
    const euro = parseFloat(raw.replace(',', '.'))
    if (!Number.isNaN(euro) && setting) {
      setPrice(euroToPoints(euro, setting))
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !profile?.family_id) return

    setUploadingImage(true)
    setImageUploadError(null)

    try {
      // Sofort eine lokale Vorschau zeigen, unabhängig vom Hochladen - so
      // sieht man direkt, dass das Foto ausgewählt wurde, auch falls der
      // Upload danach fehlschlägt (z. B. schwaches Mobilfunknetz).
      setImagePreview(URL.createObjectURL(file))

      const rawName = file.name || ''
      const rawExt = rawName.includes('.') ? rawName.split('.').pop() ?? '' : ''
      const safeExt = /^[a-zA-Z0-9]{1,5}$/.test(rawExt) ? rawExt.toLowerCase() : 'jpg'
      const filePath = `${profile.family_id}/${crypto.randomUUID()}.${safeExt}`

      const { error } = await supabase.storage.from('reward-images').upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })
      if (error) {
        setImageUploadError('Bild-Upload fehlgeschlagen: ' + error.message)
        return
      }

      const { data } = supabase.storage.from('reward-images').getPublicUrl(filePath)
      setImageUrl(data.publicUrl)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Bild-Upload Fehler:', err)
      setImageUploadError(
        err instanceof Error
          ? `Bild-Upload fehlgeschlagen: ${err.message}`
          : 'Bild-Upload fehlgeschlagen. Bitte nochmal versuchen oder ein anderes Foto wählen.'
      )
    } finally {
      setUploadingImage(false)
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

  async function saveReward(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !profile?.family_id) return
    setSaving(true)
    if (editingId) {
      await supabase
        .from('rewards')
        .update({
          title,
          description: description || null,
          image_url: imageUrl || null,
          point_price: price,
          redeem_limit: redeemLimit,
        })
        .eq('id', editingId)
    } else {
      await supabase.from('rewards').insert({
        family_id: profile.family_id,
        title,
        description: description || null,
        image_url: imageUrl || null,
        point_price: price,
        redeem_limit: redeemLimit,
      })
    }
    resetForm()
    setSaving(false)
    load()
  }

  async function toggleActive(reward: Reward) {
    await supabase.from('rewards').update({ active: !reward.active }).eq('id', reward.id)
    load()
  }

  async function deleteReward(reward: Reward) {
    if (!window.confirm(`„${reward.title}" wirklich endgültig löschen?`)) return
    await supabase.from('rewards').delete().eq('id', reward.id)
    if (editingId === reward.id) resetForm()
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
          placeholder="Produktlink einfügen"
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

      <form onSubmit={saveReward} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-8">
        {editingId && (
          <div className="sm:col-span-4 flex items-center justify-between rounded-lg bg-[var(--color-coin-soft)] px-3 py-2 text-sm">
            <span className="font-semibold">Belohnung bearbeiten</span>
            <button type="button" onClick={resetForm} className="underline font-semibold">
              Abbrechen
            </button>
          </div>
        )}
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
        <label className="sm:col-span-4 flex flex-col gap-1 text-sm">
          Einlösbar
          <select
            value={redeemLimit}
            onChange={(e) => setRedeemLimit(e.target.value as RewardLimit)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          >
            <option value="unlimited">Mehrmals</option>
            <option value="once">Einmalig</option>
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </label>
        <p className="sm:col-span-4 text-xs text-[var(--color-ink-soft)] -mt-2">
          {redeemLimit === 'unlimited' && 'Beliebig oft einlösbar, solange genug Punkte vorhanden sind.'}
          {redeemLimit === 'once' && 'Kann insgesamt nur ein einziges Mal eingelöst werden.'}
          {redeemLimit === 'daily' && 'Setzt sich jeden Tag um Mitternacht zurück.'}
          {redeemLimit === 'weekly' && 'Setzt sich jeden Montag zurück.'}
          {redeemLimit === 'monthly' && 'Setzt sich am 1. jedes Monats zurück.'}
        </p>
        <div className="sm:col-span-4 flex flex-col sm:flex-row gap-2">
          <input
            placeholder="Bild-URL (optional)"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value)
              setImagePreview('')
            }}
            className="w-full sm:flex-1 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-3 py-2"
          />
          <label className="relative inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold text-sm bg-[var(--color-ink)] text-white dark:text-[var(--color-bg-dark)] cursor-pointer whitespace-nowrap">
            {uploadingImage ? 'Lädt hoch…' : '📷 Vom Gerät hochladen'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="sr-only"
            />
          </label>
        </div>
        {imageUploadError && (
          <p className="sm:col-span-4 text-sm text-[var(--color-clay)] -mt-1">{imageUploadError}</p>
        )}
        {(imagePreview || imageUrl) && (
          <div className="sm:col-span-4 flex items-center gap-3">
            <img
              src={imagePreview || imageUrl}
              alt="Vorschau"
              className="w-16 h-16 rounded-lg object-cover border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)]"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span className="text-xs text-[var(--color-ink-soft)]">
              {uploadingImage ? 'Wird hochgeladen…' : 'Bildvorschau'}
            </span>
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
          {saving ? 'Speichert…' : editingId ? 'Änderungen speichern' : 'Belohnung anlegen'}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {rewards.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4"
          >
            {r.image_url && (
              <img
                src={r.image_url}
                alt=""
                className="w-full aspect-video object-cover rounded-lg mb-2"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
            <h3 className="font-display font-semibold">{r.title}</h3>
            <p className="ledger-figure text-[var(--color-coin)] font-semibold mt-1">{r.point_price} Pkt</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">{rewardLimitLabels[r.redeem_limit]}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => toggleActive(r)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  r.active
                    ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                    : 'border-[var(--color-ink-soft)] text-[var(--color-ink-soft)]'
                }`}
              >
                {r.active ? 'Aktiv' : 'Inaktiv'}
              </button>
              <button
                onClick={() => startEdit(r)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)] dark:border-[var(--color-paper-dim)]"
              >
                Bearbeiten
              </button>
              <button
                onClick={() => deleteReward(r)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-clay)] text-[var(--color-clay)]"
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
