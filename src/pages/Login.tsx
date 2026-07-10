import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Anmeldung fehlgeschlagen: ' + error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl">🪙</span>
          <h1 className="font-display text-2xl font-semibold mt-2">Willkommen zurück</h1>
          <p className="text-[var(--color-ink-soft)] text-sm mt-1">Melde dich bei FamilyPoints an</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-2.5"
          />
          {error && <p className="text-sm text-[var(--color-clay)]">{error}</p>}
          <button
            disabled={loading}
            className="rounded-full py-2.5 font-semibold bg-[var(--color-parent)] text-white disabled:opacity-50"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-[var(--color-ink-soft)]">
          Noch kein Konto? <Link to="/register" className="font-semibold underline">Registrieren</Link>
        </p>
      </div>
    </div>
  )
}
