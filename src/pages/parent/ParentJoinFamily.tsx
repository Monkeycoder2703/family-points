import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'

export default function ParentJoinFamily() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirming) {
      setConfirming(true)
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.rpc('redeem_invite_code', { p_code: code.trim().toUpperCase() })
    setLoading(false)
    if (error) {
      setError('Code konnte nicht eingelöst werden: ' + error.message)
      setConfirming(false)
      return
    }
    await refreshProfile()
    navigate('/parent/dashboard')
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center">
        <h1 className="font-display text-2xl font-semibold mb-2">Familie wechseln</h1>
        <p className="text-[var(--color-ink-soft)] mb-6">
          Gib einen Einladungscode ein, um dich mit einer bestehenden Familie zu verbinden (z. B. wenn ein anderer
          Elternteil eurer Familie einen Code für dich erzeugt hat).
        </p>

        <div className="rounded-xl bg-[var(--color-clay-soft)] text-left p-4 mb-6 text-sm">
          <p className="font-semibold mb-1">⚠️ Wichtig, bevor du fortfährst</p>
          <p>
            Dein Konto wechselt danach vollständig in die neue Familie. Aufgaben, Belohnungen und Kinder, die du
            bisher in deiner aktuellen Familie angelegt hast, bleiben dort bestehen, sind für dich danach aber nicht
            mehr sichtbar. Das lässt sich nicht automatisch rückgängig machen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setConfirming(false)
            }}
            placeholder="Z. B. 8F3K2A"
            className="text-center font-mono text-2xl tracking-widest rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-3 uppercase"
            maxLength={6}
          />
          {error && <p className="text-sm text-[var(--color-clay)]">{error}</p>}
          <button
            disabled={loading}
            className={`rounded-full py-2.5 font-semibold text-white disabled:opacity-50 ${
              confirming ? 'bg-[var(--color-clay)]' : 'bg-[var(--color-parent)]'
            }`}
          >
            {loading ? 'Wechsle…' : confirming ? 'Wirklich wechseln – jetzt bestätigen' : 'Weiter'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
