import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/Layout'
import type { InviteCode } from '../types'

export default function OnboardingConnectChild() {
  const [childName, setChildName] = useState('')
  const [invite, setInvite] = useState<InviteCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('create_invite_code', {
      p_child_display_name: childName || null,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setInvite(data as InviteCode)
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center">
        <h1 className="font-display text-2xl font-semibold mb-2">Kind verbinden</h1>
        <p className="text-[var(--color-ink-soft)] mb-6">
          Erzeuge einen Code und gib ihn deinem Kind – es gibt ihn bei der Registrierung ein und ist danach dauerhaft mit eurer Familie verbunden.
        </p>

        {!invite ? (
          <div className="flex flex-col gap-3">
            <input
              placeholder="Name des Kindes (optional, nur als Erinnerung)"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
            />
            <button
              onClick={generate}
              disabled={loading}
              className="rounded-full py-2.5 font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
            >
              {loading ? 'Erzeuge Code…' : 'Code erzeugen'}
            </button>
            {error && <p className="text-sm text-[var(--color-clay)]">{error}</p>}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[var(--color-coin)] p-8">
            <p className="text-sm text-[var(--color-ink-soft)] mb-2">Euer Verbindungscode</p>
            <p className="font-mono text-4xl font-bold tracking-widest text-[var(--color-coin)]">{invite.code}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-3">
              Gültig bis {new Date(invite.expires_at).toLocaleDateString('de-DE')} · einmalig verwendbar
            </p>
            <button
              onClick={() => setInvite(null)}
              className="mt-4 text-sm font-semibold underline text-[var(--color-ink-soft)]"
            >
              Neuen Code erzeugen
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
