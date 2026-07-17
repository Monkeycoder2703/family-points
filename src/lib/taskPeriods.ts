import type { RepeatType } from '../types'

/** Anfang des aktuellen Zeitraums für eine Wiederholung, oder null für "einmalig" (gilt für immer). */
export function periodStart(repeatType: RepeatType, now: Date = new Date()): Date | null {
  if (repeatType === 'once') return null

  const d = new Date(now)
  if (repeatType === 'daily') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (repeatType === 'weekly') {
    const dayIndex = (d.getDay() + 6) % 7 // Montag = 0
    d.setDate(d.getDate() - dayIndex)
    d.setHours(0, 0, 0, 0)
    return d
  }
  // monthly: setzt sich immer am 1. Tag des Monats zurück
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

export type ChildTaskStatus = 'open' | 'pending' | 'done_for_period'

interface CompletionLike {
  status: string
  completed_at: string
}

/** Ermittelt den Status einer Aufgabe für ein Kind anhand seiner bisherigen Meldungen. */
export function getTaskStatus(repeatType: RepeatType, completions: CompletionLike[]): ChildTaskStatus {
  if (completions.some((c) => c.status === 'pending')) return 'pending'

  const approved = completions.filter((c) => c.status === 'approved')
  if (approved.length === 0) return 'open'

  if (repeatType === 'once') return 'done_for_period'

  const start = periodStart(repeatType)!
  const doneThisPeriod = approved.some((c) => new Date(c.completed_at) >= start)
  return doneThisPeriod ? 'done_for_period' : 'open'
}

export function resetLabel(repeatType: RepeatType): string {
  switch (repeatType) {
    case 'daily':
      return 'Morgen wieder verfügbar'
    case 'weekly':
      return 'Ab nächster Woche wieder verfügbar'
    case 'monthly':
      return 'Ab dem 1. nächsten Monats wieder verfügbar'
    default:
      return 'Bereits erledigt'
  }
}
