import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { RewardCard } from '../../components/RewardCard'
import { formatEuro } from '../../lib/points'
import type { PointSetting, PointTransaction, Reward, Task, TaskCompletion } from '../../types'

export default function ChildDashboard() {
  const { profile } = useAuth()
  const [openTasks, setOpenTasks] = useState<Task[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [recent, setRecent] = useState<PointTransaction[]>([])
  const [setting, setSetting] = useState<PointSetting | null>(null)
  const [myCompletions, setMyCompletions] = useState<TaskCompletion[]>([])

  async function load() {
    if (!profile) return
    const { data: tasks } = await supabase.from('tasks').select('*').eq('active', true)
    const { data: completions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('child_id', profile.id)
      .eq('status', 'pending')
    setMyCompletions((completions as TaskCompletion[]) ?? [])
    const pendingTaskIds = new Set((completions as TaskCompletion[] | null)?.map((c) => c.task_id))
    setOpenTasks(((tasks as Task[]) ?? []).filter((t) => !pendingTaskIds.has(t.id)))

    const { data: r } = await supabase.from('rewards').select('*').eq('active', true)
    setRewards(((r as Reward[]) ?? []).slice(0, 4))

    const { data: tx } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('child_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecent((tx as PointTransaction[]) ?? [])

    const { data: s } = await supabase
      .from('point_settings')
      .select('*')
      .eq('family_id', profile.family_id)
      .single()
    setSetting((s as PointSetting) ?? null)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function completeTask(taskId: string) {
    await supabase.rpc('request_task_completion', { p_task_id: taskId })
    load()
  }

  if (!profile) return null

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-4">Hallo, {profile.display_name}! 👋</h1>

      <div className="rounded-2xl bg-[var(--color-coin-soft)] p-6 text-center mb-8">
        <p className="font-display text-4xl font-bold ledger-figure text-[var(--color-ink)]">
          ★ {profile.current_point_balance.toLocaleString('de-DE')}
        </p>
        {setting && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            ≈ {formatEuro((profile.current_point_balance / setting.points_per_unit) * setting.euro_value)}
          </p>
        )}
      </div>

      <h2 className="font-display text-xl font-semibold mb-3">Offene Aufgaben</h2>
      <div className="flex flex-col gap-2 mb-8">
        {openTasks.length === 0 && myCompletions.length === 0 && (
          <p className="text-[var(--color-ink-soft)]">Keine offenen Aufgaben – super gemacht! 🎉</p>
        )}
        {openTasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4"
          >
            <span className="font-semibold min-w-0">{task.title}</span>
            <div className="flex items-center gap-3">
              <span className="ledger-figure font-semibold text-[var(--color-coin)]">+{task.points}</span>
              <button
                onClick={() => completeTask(task.id)}
                className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--color-sage)] text-white"
              >
                Erledigt ✓
              </button>
            </div>
          </div>
        ))}
        {myCompletions.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-dashed border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] p-4 opacity-70"
          >
            <span>Wartet auf Bestätigung…</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-semibold">Meine Belohnungen</h2>
        <Link to="/child/rewards" className="text-sm font-semibold underline">
          Alle ansehen
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {rewards.map((r) => (
          <RewardCard key={r.id} reward={r} currentPoints={profile.current_point_balance} />
        ))}
      </div>

      <h2 className="font-display text-xl font-semibold mb-3">Letzte Aktivitäten</h2>
      <div className="flex flex-col gap-2">
        {recent.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-ink-soft)]">{tx.reason ?? tx.source_type}</span>
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
      </div>
    </Layout>
  )
}
