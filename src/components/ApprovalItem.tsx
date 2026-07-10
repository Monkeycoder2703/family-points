import type { ReactNode } from 'react'

export function ApprovalItem({
  title,
  subtitle,
  points,
  onApprove,
  onReject,
  busy,
}: {
  title: string
  subtitle: string
  points: number
  onApprove: () => void
  onReject: () => void
  busy?: boolean
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="ledger-figure text-[var(--color-coin)] font-semibold">{points > 0 ? '+' : ''}{points}</span>
        <button
          disabled={busy}
          onClick={onReject}
          className="rounded-full px-3 py-2 text-sm font-semibold border border-[var(--color-clay)] text-[var(--color-clay)] disabled:opacity-50"
        >
          Ablehnen
        </button>
        <button
          disabled={busy}
          onClick={onApprove}
          className="rounded-full px-3 py-2 text-sm font-semibold bg-[var(--color-sage)] text-white disabled:opacity-50"
        >
          Bestätigen
        </button>
      </div>
    </div>
  )
}

export function StampBadge({ status }: { status: 'approved' | 'rejected' | 'pending' }) {
  if (status === 'pending') {
    return (
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Ausstehend</span>
    )
  }
  return (
    <span className={`stamp ${status === 'rejected' ? 'rejected' : ''}`}>
      {status === 'approved' ? '✓ Genehmigt' : '✕ Abgelehnt'}
    </span>
  )
}
