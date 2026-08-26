import type { Discipline, Intensity } from '../types/catalog'

export const intensityLabels: Record<Intensity, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const disciplineLabels: Record<Discipline, string> = {
  singles: 'シングルス',
  doubles: 'ダブルス',
  both: '共通',
}

const valueLabels: Record<string, string> = {
  court: 'コート',
  home: '自宅',
  gym: 'ジム',
  outdoor: '屋外',
  'court-side': 'コートサイド',
  racket: 'ラケット',
  balls: 'ボール',
  targets: 'ターゲット',
  cones: 'コーン',
  band: 'チューブ',
  box: 'ボックス',
  'medicine-ball': 'メディシンボール',
  'net-marker': 'ネット目印',
  'foam-roller': 'フォームローラー',
  'mat-optional': 'マット（任意）',
  'low-bar-or-line': '低いバーまたはライン',
  music: '音楽',
}

export function displayValue(value: string) {
  return valueLabels[value] ?? value
}
