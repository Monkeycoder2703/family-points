import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Role } from '../types'

export default function Register() {
  const [role, setRole] = useState<Role>('parent')
  const [displayName, setDisplayName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          display_name: displayName,
          family_name: familyName || undefined,
        },
      },
    })
    setLoading(false)
    if (error) {
      setError('Registrierung fehlgeschlagen: ' + error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-3xl">🪙</span>
          <h1 className="font-display text-2xl font-semibold mt-2">Konto erstellen</h1>
        </div>

        <div className="flex rounded-full border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] p-1 mb-5">
          <button
            type="button"
            onClick={() => setRole('parent')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              role === 'parent' ? 'bg-[var(--color-parent)] text-white' : ''
            }`}
          >
            Elternteil
          </button>
          <button
            type="button"
            onClick={() => setRole('child')}
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              role === 'child' ? 'bg-[var(--color-child)] text-white' : ''
            }`}
          >
            Kind
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            placeholder={role === 'parent' ? 'Dein Name' : 'Dein Name'}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
          />
          {role === 'parent' && (
            <input
              placeholder="Familienname (optional, z. B. „Familie Müller“)"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
            />
          )}
          <input
            type="email"
            required
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Passwort (mind. 6 Zeichen)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
          />
          {role === 'child' && (
            <p className="text-xs text-[var(--color-ink-soft)]">
              Du brauchst nach der Registrierung einen Einladungscode von einem Elternteil, um dich mit eurer Familie zu verbinden.
            </p>
          )}
          {error && <p className="text-sm text-[var(--color-clay)]">{error}</p>}
          <button
            disabled={loading}
            className="rounded-full py-2.5 font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
          >
            {loading ? 'Wird erstellt…' : 'Konto erstellen'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-[var(--color-ink-soft)]">
          Schon registriert? <Link to="/login" className="font-semibold underline">Anmelden</Link>
        </p>
      </div>
    </div>
  )
}
