import { describe, expect, it } from 'vitest'
import { getFreshnessProgress, getFreshnessStatus } from './freshness'

const NOW = Date.parse('2026-08-04T12:00:00.000Z')

describe('getFreshnessProgress', () => {
  it('returns full freshness immediately after completion', () => {
    expect(getFreshnessProgress('2026-08-04T12:00:00.000Z', 3, 1, undefined, NOW)).toBe(1)
  })

  it('fades linearly to zero over the effective period', () => {
    expect(getFreshnessProgress('2026-08-03T00:00:00.000Z', 3, 1, undefined, NOW)).toBeCloseTo(0.5)
    expect(getFreshnessProgress('2026-08-01T12:00:00.000Z', 3, 1, undefined, NOW)).toBe(0)
  })

  it('combines a per-item override with the global multiplier', () => {
    expect(getFreshnessProgress('2026-08-02T12:00:00.000Z', 3, 2, 2, NOW)).toBeCloseTo(0.5)
  })

  it('handles missing, invalid, and future timestamps safely', () => {
    expect(getFreshnessProgress(undefined, 3, 1, undefined, NOW)).toBe(0)
    expect(getFreshnessProgress('invalid', 3, 1, undefined, NOW)).toBe(0)
    expect(getFreshnessProgress('2026-08-05T12:00:00.000Z', 3, 1, undefined, NOW)).toBe(1)
  })
})

describe('getFreshnessStatus', () => {
  it('keeps never completed separate from expired', () => {
    expect(getFreshnessStatus(0, false)).toBe('never')
    expect(getFreshnessStatus(0, true)).toBe('expired')
  })
})
