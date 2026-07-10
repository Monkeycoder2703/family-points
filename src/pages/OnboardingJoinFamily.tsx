import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function OnboardingJoinFamily() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.rpc('redeem_invite_code', { p_code: code.trim().toUpperCase() })
    setLoading(false)
    if (error) {
      setError('Code konnte nicht eingelöst werden: ' + error.message)
      return
    }
    await refreshProfile()
    navigate('/child/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <span className="text-3xl">🔗</span>
        <h1 className="font-display text-2xl font-semibold mt-2 mb-2">Mit Familie verbinden</h1>
        <p className="text-[var(--color-ink-soft)] text-sm mb-6">
          Gib den 6-stelligen Code ein, den du von einem Elternteil bekommen hast.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Z. B. 8F3K2A"
            className="text-center font-mono text-2xl tracking-widest rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-3 uppercase"
            maxLength={6}
          />
          {error && <p className="text-sm text-[var(--color-clay)]">{error}</p>}
          <button
            disabled={loading}
            className="rounded-full py-2.5 font-semibold bg-[var(--color-child)] text-white disabled:opacity-50"
          >
            {loading ? 'Verbinde…' : 'Verbinden'}
          </button>
        </form>
      </div>
    </div>
  )
}
