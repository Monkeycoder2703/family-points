import type { Task } from '../types'
import type { ChildTaskStatus } from '../lib/taskPeriods'
import { resetLabel } from '../lib/taskPeriods'

const repeatLabels: Record<string, string> = {
  once: 'Einmalig',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
}

export function TaskCard({
  task,
  onComplete,
  status = 'open',
}: {
  task: Task
  onComplete?: () => void
  status?: ChildTaskStatus
}) {
  const isDone = status === 'done_for_period'
  const isPending = status === 'pending'

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4 ${
        isDone ? 'opacity-60' : ''
      }`}
    >
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
            disabled={isPending || isDone}
            onClick={onComplete}
            className="flex-1 sm:flex-none rounded-full px-4 py-2 text-sm font-semibold bg-[var(--color-sage)] text-white disabled:opacity-50"
          >
            {isPending ? 'Wartet auf Freigabe' : isDone ? `✓ ${resetLabel(task.repeat_type)}` : 'Erledigt ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
