import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Layout } from '../../components/Layout'
import { RewardCard } from '../../components/RewardCard'
import { getRewardStatus, type ChildTaskStatus } from '../../lib/taskPeriods'
import type { Redemption, Reward } from '../../types'

export default function ChildRewards() {
  const { profile } = useAuth()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [statusByReward, setStatusByReward] = useState<Record<string, ChildTaskStatus>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    if (!profile) return
    const { data: r } = await supabase.from('rewards').select('*').eq('active', true).order('point_price')
    const rewardList = (r as Reward[]) ?? []
    setRewards(rewardList)

    const { data: red } = await supabase
      .from('redemptions')
      .select('*')
      .eq('child_id', profile.id)
      .in('status', ['pending', 'approved'])
    const redemptions = (red as Redemption[]) ?? []

    const statuses: Record<string, ChildTaskStatus> = {}
    for (const reward of rewardList) {
      statuses[reward.id] = getRewardStatus(
        reward.redeem_limit,
        redemptions.filter((x) => x.reward_id === reward.id)
      )
    }
    setStatusByReward(statuses)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function redeem(rewardId: string) {
    setMessage(null)
    const { error } = await supabase.rpc('request_redemption', { p_reward_id: rewardId })
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Anfrage gesendet – wartet auf Bestätigung deiner Eltern.')
    load()
  }

  if (!profile) return null

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold mb-6">Belohnungen</h1>
      {message && <p className="mb-4 text-sm text-[var(--color-sage)] font-semibold">{message}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {rewards.map((r) => (
          <RewardCard
            key={r.id}
            reward={r}
            currentPoints={profile.current_point_balance}
            status={statusByReward[r.id] ?? 'open'}
            onRedeem={() => redeem(r.id)}
          />
        ))}
        {rewards.length === 0 && <p className="text-[var(--color-ink-soft)]">Noch keine Belohnungen angelegt.</p>}
      </div>
    </Layout>
  )
}
