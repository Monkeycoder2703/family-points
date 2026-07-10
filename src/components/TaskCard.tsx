import type { Task } from '../types'

const repeatLabels: Record<string, string> = {
  once: 'Einmalig',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
}

export function TaskCard({
  task,
  onComplete,
  pending,
}: {
  task: Task
  onComplete?: () => void
  pending?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4">
      <div className="min-w-0">
        <p className="font-semibold">{task.title}</p>
        {task.description && <p className="text-sm text-[var(--color-ink-soft)]">{task.description}</p>}
        <span className="text-xs text-[var(--color-ink-soft)] uppercase tracking-wide">
          {repeatLabels[task.repeat_type]} {task.category ? `· ${task.category}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="ledger-figure font-semibold text-[var(--color-coin)]">+{task.points}</span>
        {onComplete && (
          <button
            disabled={pending}
            onClick={onComplete}
            className="flex-1 sm:flex-none rounded-full px-4 py-2 text-sm font-semibold bg-[var(--color-sage)] text-white disabled:opacity-50"
          >
            {pending ? 'Wartet auf Freigabe' : 'Erledigt ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
