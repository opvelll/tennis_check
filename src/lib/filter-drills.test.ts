import { describe, expect, it } from 'vitest'
import { drills, sourceById } from '../data/catalog'
import { emptyFilters, filterDrills } from './filter-drills'

describe('filterDrills', () => {
  it('loads the complete catalog', () => {
    expect(drills).toHaveLength(108)
    expect(new Set(drills.map((drill) => drill.id)).size).toBe(108)
    expect(drills.every((drill) => drill.media.every((id) => sourceById.has(id)))).toBe(true)
    expect(drills.every((drill) => drill.sources.every((id) => sourceById.has(id)))).toBe(true)
  })

  it('searches names, summaries, tags, and cues with NFKC normalization', () => {
    expect(filterDrills(drills, { ...emptyFilters, query: 'ボックスジャンプ' }).map((drill) => drill.id)).toContain('phy-rfd-02')
    expect(filterDrills(drills, { ...emptyFilters, query: '高いバウンド' }).some((drill) => drill.id === 'tech-fh-05')).toBe(true)
  })

  it('combines structured filters with AND semantics', () => {
    const results = filterDrills(drills, {
      ...emptyFilters,
      discipline: 'singles',
      category: 'シングルス戦術',
      playerCount: 2,
      environment: 'court',
      intensity: 'medium',
      maxDuration: 25,
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results.every((drill) => drill.category[0] === 'シングルス戦術')).toBe(true)
  })
})
