import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Layout } from '../../components/Layout'
import { ApprovalItem } from '../../components/ApprovalItem'
import type { Grade, Redemption, TaskCompletion } from '../../types'

export default function ParentApprovals() {
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data: c } = await supabase
      .from('task_completions')
      .select('*, task:tasks(*), child:profiles!task_completions_child_id_fkey(*)')
      .eq('status', 'pending')
      .order('completed_at', { ascending: false })
    setCompletions((c as unknown as TaskCompletion[]) ?? [])

    const { data: r } = await supabase
      .from('redemptions')
      .select('*, reward:rewards(*), child:profiles!redemptions_child_id_fkey(*)')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
    setRedemptions((r as unknown as Redemption[]) ?? [])

    const { data: g } = await supabase
      .from('grades')
      .select('*, subject:subjects(*), child:profiles!grades_child_id_fkey(*)')
      .eq('status', 'pending')
      .order('date', { ascending: false })
    setGrades((g as unknown as Grade[]) ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function reviewTask(id: string, approve: boolean) {
    setBusyId(id)
    await supabase.rpc('review_task_completion', { p_completion_id: id, p_approve: approve })
    setBusyId(null)
    load()
  }

  async function reviewRedemption(id: string, approve: boolean) {
    setBusyId(id)
    await supabase.rpc('review_redemption', { p_redemption_id: id, p_approve: approve })
    setBusyId(null)
    load()
  }

  async function reviewGrade(id: string, approve: boolean) {
    setBusyId(id)
    await supabase.rpc('review_grade', { p_grade_id: id, p_approve: approve })
    setBusyId(null)
    load()
  }

  const nothingOpen = completions.length === 0 && redemptions.length === 0 && grades.length === 0

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Freigaben</h1>

      {nothingOpen && (
        <p className="text-[var(--color-ink-soft)] text-center py-16">Aktuell nichts zu bestätigen. 🎉</p>
      )}

      {completions.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--color-ink-soft)] mb-2">
            Erledigte Aufgaben
          </h2>
          <div className="flex flex-col gap-2">
            {completions.map((c) => (
              <ApprovalItem
                key={c.id}
                title={`${c.child?.display_name} · ${c.task?.title}`}
                subtitle={new Date(c.completed_at).toLocaleString('de-DE')}
                points={c.task?.points ?? 0}
                busy={busyId === c.id}
                onApprove={() => reviewTask(c.id, true)}
                onReject={() => reviewTask(c.id, false)}
              />
            ))}
          </div>
        </div>
      )}

      {grades.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--color-ink-soft)] mb-2">
            Eingetragene Noten
          </h2>
          <div className="flex flex-col gap-2">
            {grades.map((g) => (
              <ApprovalItem
                key={g.id}
                title={`${g.child?.display_name} · ${g.subject?.name ?? 'Fach'} · Note ${g.grade_value}${
                  g.is_report_card ? ' (Zeugnis)' : ''
                }`}
                subtitle={new Date(g.date).toLocaleDateString('de-DE')}
                points={g.points_awarded}
                busy={busyId === g.id}
                onApprove={() => reviewGrade(g.id, true)}
                onReject={() => reviewGrade(g.id, false)}
              />
            ))}
          </div>
        </div>
      )}

      {redemptions.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--color-ink-soft)] mb-2">
            Belohnungs-Einlösungen
          </h2>
          <div className="flex flex-col gap-2">
            {redemptions.map((r) => (
              <ApprovalItem
                key={r.id}
                title={`${r.child?.display_name} möchte „${r.reward?.title}“ einlösen`}
                subtitle={new Date(r.requested_at).toLocaleString('de-DE')}
                points={-r.points_spent}
                busy={busyId === r.id}
                onApprove={() => reviewRedemption(r.id, true)}
                onReject={() => reviewRedemption(r.id, false)}
              />
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
