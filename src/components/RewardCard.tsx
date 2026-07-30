import type { Reward } from '../types'
import type { ChildTaskStatus } from '../lib/taskPeriods'
import { resetLabel } from '../lib/taskPeriods'

interface Props {
  reward: Reward
  currentPoints: number
  onRedeem?: () => void
  status?: ChildTaskStatus
}

export function RewardCard({ reward, currentPoints, onRedeem, status = 'open' }: Props) {
  const pct = Math.min(100, Math.round((currentPoints / Math.max(1, reward.point_price)) * 100))
  const canAfford = currentPoints >= reward.point_price
  const isPending = status === 'pending'
  const isDone = status === 'done_for_period'
  const canRedeem = canAfford && !isPending && !isDone

  return (
    <div className="rounded-2xl border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4 flex flex-col gap-3">
      <div className="aspect-video w-full rounded-xl bg-[var(--color-paper-dim)] dark:bg-[var(--color-border-dark)] overflow-hidden flex items-center justify-center">
        {reward.image_url ? (
          <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">🎁</span>
        )}
      </div>
      <div>
        <h3 className="font-display font-semibold text-lg leading-tight">{reward.title}</h3>
        {reward.description && (
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 line-clamp-2">{reward.description}</p>
        )}
        {reward.redeem_limit !== 'unlimited' && (
          <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-coin-soft)] text-[var(--color-ink)]">
            {reward.redeem_limit === 'once'
              ? 'Einmalig'
              : reward.redeem_limit === 'daily'
                ? 'Täglich'
                : reward.redeem_limit === 'weekly'
                  ? 'Wöchentlich'
                  : 'Monatlich'}
          </span>
        )}
      </div>
      <div>
        <div className="flex justify-between text-xs ledger-figure text-[var(--color-ink-soft)] mb-1">
          <span>{currentPoints.toLocaleString('de-DE')} Pkt</span>
          <span>{reward.point_price.toLocaleString('de-DE')} Pkt nötig</span>
        </div>
        <div className="jar">
          <div className="jar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-right text-xs mt-1 text-[var(--color-coin)] font-semibold">{pct}%</div>
      </div>
      {onRedeem && (
        <button
          disabled={!canRedeem}
          onClick={onRedeem}
          className="mt-1 rounded-full py-2 font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--color-child)] text-white hover:brightness-95"
        >
          {isPending
            ? 'Wartet auf Freigabe'
            : isDone
              ? `✓ ${resetLabel(reward.redeem_limit)}`
              : canAfford
                ? 'Einlösen'
                : 'Noch nicht genug Punkte'}
        </button>
      )}
    </div>
  )
}
