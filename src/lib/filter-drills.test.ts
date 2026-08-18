import { describe, expect, it } from 'vitest'
import { catalogIndex, drills, sourceById } from '../data/catalog'
import { emptyFilters, filterDrills } from './filter-drills'

describe('filterDrills', () => {
  it('loads the complete catalog', () => {
    expect(drills).toHaveLength(110)
    expect(drills).toHaveLength(catalogIndex.totalDrills)
    expect(new Set(drills.map((drill) => drill.id)).size).toBe(110)
    catalogIndex.files.forEach((category) => {
      const categoryDrills = drills.filter((drill) => drill.category[0] === category.label)
      expect(categoryDrills).toHaveLength(category.count)
    })
    expect(drills.every((drill) => drill.media.every((id) => sourceById.has(id)))).toBe(true)
    expect(drills.every((drill) => drill.sources.every((id) => sourceById.has(id)))).toBe(true)
  })

  it('exposes conditioning routines through category and format filters', () => {
    const warmups = filterDrills(drills, {
      ...emptyFilters,
      category: 'コンディショニング',
      format: 'ウォームアップ',
    })
    const cooldowns = filterDrills(drills, {
      ...emptyFilters,
      category: 'コンディショニング',
      format: 'クールダウン',
    })

    expect(warmups.map((drill) => drill.id)).toEqual([
      'prep-01',
      'prep-02',
      'conditioning-smr-01',
    ])
    expect(cooldowns.map((drill) => drill.id)).toEqual([
      'recovery-01',
      'conditioning-smr-01',
    ])
  })

  it('loads the full-body SMR routine and its source', () => {
    const smr = filterDrills(drills, { ...emptyFilters, query: '筋膜リリース' })
      .find((drill) => drill.id === 'conditioning-smr-01')

    expect(smr?.steps).toHaveLength(10)
    expect(smr?.safetyNotes).toHaveLength(3)
    expect(sourceById.get('todai-smr')?.url).toBe(
      'https://www.youtube.com/watch?v=5gEWFxQOnUg',
    )
  })

  it('loads the groin and hip mobility exercise with its video', () => {
    const drill = filterDrills(drills, { ...emptyFilters, query: '鼠径部' })
      .find((item) => item.id === 'move-13')

    expect(drill?.steps).toHaveLength(4)
    expect(drill?.safetyNotes).toHaveLength(2)
    expect(sourceById.get('sokeibu-hip-video')?.url).toBe(
      'https://www.youtube.com/watch?v=UMtLD3Rod4g',
    )
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
