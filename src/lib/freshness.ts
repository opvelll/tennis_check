const DAY_MS = 24 * 60 * 60 * 1000

export type FreshnessStatus = 'fresh' | 'fading' | 'expired' | 'never'

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function getFreshnessProgress(
  lastCompletedAt: string | undefined,
  defaultFadeDays: number,
  fadeMultiplier: number,
  fadeDaysOverride?: number,
  nowMs = Date.now(),
) {
  if (!lastCompletedAt) return 0

  const completedAt = Date.parse(lastCompletedAt)
  if (!Number.isFinite(completedAt)) return 0

  const baseDays = fadeDaysOverride ?? defaultFadeDays
  const effectiveDays = Math.max(0.5, baseDays * fadeMultiplier)
  return clamp(1 - (nowMs - completedAt) / (effectiveDays * DAY_MS))
}

export function getFreshnessStatus(
  progress: number,
  hasCompletion: boolean,
): FreshnessStatus {
  if (!hasCompletion) return 'never'
  if (progress <= 0) return 'expired'
  if (progress >= 0.72) return 'fresh'
  return 'fading'
}

export const freshnessLabels: Record<FreshnessStatus, string> = {
  fresh: '実施直後',
  fading: '退色中',
  expired: '期限経過',
  never: '未実施',
}

export function freshnessColor(categoryColor: string, progress: number) {
  const percentage = Math.round(clamp(progress) * 100)
  return `color-mix(in srgb, ${categoryColor} ${percentage}%, #e5e7eb)`
}
