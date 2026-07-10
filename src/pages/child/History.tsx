import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import type { PointTransaction } from '../../types'

const sourceLabels: Record<string, string> = {
  task: '✅ Aufgabe',
  grade: '📘 Note',
  reward: '🎁 Belohnung',
  manual: '✋ Manuell',
}

export default function ChildHistory() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])

  useEffect(() => {
    async function load() {
      if (!profile) return
      const { data } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('child_id', profile.id)
        .order('created_at', { ascending: false })
      setTransactions((data as PointTransaction[]) ?? [])
    }
    load()
  }, [profile?.id])

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Punkteverlauf</h1>
      <div className="flex flex-col gap-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-3"
          >
            <div>
              <p className="font-semibold text-sm">{sourceLabels[tx.source_type] ?? tx.source_type}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {tx.reason} · {new Date(tx.created_at).toLocaleString('de-DE')}
              </p>
            </div>
            <span
              className={`ledger-figure font-semibold ${
                tx.amount >= 0 ? 'text-[var(--color-sage)]' : 'text-[var(--color-clay)]'
              }`}
            >
              {tx.amount >= 0 ? '+' : ''}
              {tx.amount}
            </span>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-[var(--color-ink-soft)]">Noch keine Aktivitäten.</p>}
      </div>
    </Layout>
  )
}
