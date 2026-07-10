import type { PointSetting } from '../types'

/** Rechnet Punkte in Euro um, basierend auf der Familien-Einstellung. */
export function pointsToEuro(points: number, setting: PointSetting): number {
  if (!setting.points_per_unit) return 0
  return (points / setting.points_per_unit) * setting.euro_value
}

/** Rechnet einen Euro-Betrag in Punkte um (z. B. für den Belohnungs-Import). */
export function euroToPoints(euro: number, setting: PointSetting): number {
  if (!setting.euro_value) return 0
  return Math.round((euro / setting.euro_value) * setting.points_per_unit)
}

export function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}

export function formatPoints(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('de-DE')} Pkt`
}
