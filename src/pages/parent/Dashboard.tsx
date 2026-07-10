import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Layout } from '../../components/Layout'
import { PointBadge } from '../../components/PointBadge'
import type { Profile } from '../../types'

export default function ParentDashboard() {
  const [children, setChildren] = useState<Profile[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: kids } = await supabase.from('profiles').select('*').eq('role', 'child')
      setChildren((kids as Profile[]) ?? [])

      const { count } = await supabase
        .from('task_completions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Familienübersicht</h1>
        <Link
          to="/onboarding/connect-child"
          className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--color-parent)] text-white"
        >
          + Kind verbinden
        </Link>
      </div>

      {pendingCount > 0 && (
        <Link
          to="/parent/approvals"
          className="block mb-6 rounded-xl bg-[var(--color-coin-soft)] px-4 py-3 font-semibold text-[var(--color-ink)]"
        >
          🔔 {pendingCount} offene Freigabe{pendingCount === 1 ? '' : 'n'} wartet auf dich →
        </Link>
      )}

      {loading ? (
        <p>Lädt…</p>
      ) : children.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-ink-soft)]">
          <p className="mb-3">Noch kein Kind verbunden.</p>
          <Link to="/onboarding/connect-child" className="underline font-semibold">
            Jetzt ersten Verbindungscode erzeugen
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((child) => (
            <div
              key={child.id}
              className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">{child.display_name}</h2>
                <PointBadge points={child.current_point_balance} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
