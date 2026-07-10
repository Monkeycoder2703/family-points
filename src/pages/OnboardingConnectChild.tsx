import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Layout } from '../components/Layout'
import type { InviteCode, Role } from '../types'

export default function OnboardingConnectChild() {
  const [forRole, setForRole] = useState<Role>('child')
  const [childName, setChildName] = useState('')
  const [invite, setInvite] = useState<InviteCode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('create_invite_code', {
      p_child_display_name: forRole === 'child' ? childName || null : null,
      p_for_role: forRole,
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
        <h1 className="font-display text-2xl font-semibold mb-2">Familienmitglied verbinden</h1>

        <div className="flex rounded-full border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setForRole('child')
              setInvite(null)
            }}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              forRole === 'child' ? 'bg-[var(--color-child)] text-white' : ''
            }`}
          >
            Kind
          </button>
          <button
            type="button"
            onClick={() => {
              setForRole('parent')
              setInvite(null)
            }}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              forRole === 'parent' ? 'bg-[var(--color-parent)] text-white' : ''
            }`}
          >
            Zweiter Elternteil
          </button>
        </div>

        <p className="text-[var(--color-ink-soft)] mb-6">
          {forRole === 'child'
            ? 'Erzeuge einen Code und gib ihn deinem Kind – es gibt ihn bei der Registrierung ein und ist danach dauerhaft mit eurer Familie verbunden.'
            : 'Erzeuge einen Code für den zweiten Elternteil. Er/sie gibt den Code unter „Einstellungen → Familie wechseln" ein und wechselt damit zu eurer gemeinsamen Familie.'}
        </p>

        {!invite ? (
          <div className="flex flex-col gap-3">
            {forRole === 'child' && (
              <input
                placeholder="Name des Kindes (optional, nur als Erinnerung)"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
              />
            )}
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
