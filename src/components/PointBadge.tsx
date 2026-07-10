export function PointBadge({ points, size = 'md' }: { points: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-3xl px-4 py-2',
  }
  return (
    <span
      className={`ledger-figure inline-flex items-center gap-1 rounded-full bg-[var(--color-coin-soft)] text-[var(--color-ink)] font-semibold ${sizes[size]}`}
    >
      ★ {points.toLocaleString('de-DE')}
    </span>
  )
}
