import { describe, expect, it } from 'vitest'
import { catalogIndex, drills, sourceById } from '../data/catalog'
import { emptyFilters, filterDrills } from './filter-drills'

describe('filterDrills', () => {
  it('loads the complete catalog', () => {
    expect(drills).toHaveLength(153)
    expect(drills).toHaveLength(catalogIndex.totalDrills)
    expect(new Set(drills.map((drill) => drill.id)).size).toBe(153)
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
      'conditioning-cat-cow-01',
      'conditioning-smr-01',
    ])
    expect(cooldowns.map((drill) => drill.id)).toEqual([
      'recovery-01',
      'conditioning-smr-01',
    ])
  })

  it('loads cat-cow as a researched warm-up with its video', () => {
    const catCow = filterDrills(drills, { ...emptyFilters, query: 'キャットカウ' })
      .find((drill) => drill.id === 'conditioning-cat-cow-01')

    expect(catCow?.formats).toContain('ウォームアップ')
    expect(catCow?.steps).toHaveLength(3)
    expect(catCow?.safetyNotes).toHaveLength(2)
    expect(sourceById.get('senshinryochi-cat-cow')?.url).toBe(
      'https://www.youtube.com/watch?v=-ulQEZNW6cQ',
    )
  })

  it('loads the untested 16-pattern stroke drill as a draft', () => {
    const drill = filterDrills(drills, { ...emptyFilters, query: '16パターン打ち分け' })
      .find((item) => item.id === 'tech-stroke-16-pattern-01')

    expect(drill?.status).toBe('draft')
    expect(drill?.summary).toContain('未検証の試案')
    expect(drill?.steps?.[2]).toContain('16パターン')
    expect(drill?.safetyNotes?.[0]).toContain('実施結果をまだ確認していない')
    expect(drill?.media).toEqual([])
    expect(drill?.sources).toEqual([])
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

  it('loads the tennis physique video drills and merged aliases', () => {
    expect(sourceById.get('blue-guy-tennis-physique')?.url).toBe(
      'https://www.youtube.com/watch?v=wOfW3kZy_lo',
    )
    expect(filterDrills(drills, { ...emptyFilters, query: 'ランドマイン' }).map((drill) => drill.id)).toContain('phy-power-06')
    expect(filterDrills(drills, { ...emptyFilters, query: 'ブルガリアンスプリットスクワット' }).map((drill) => drill.id)).toContain('phy-strength-02')
    expect(filterDrills(drills, { ...emptyFilters, query: '色・番号コール' }).map((drill) => drill.id)).toContain('move-01')
  })

  it('loads the line rhythm jump and its reference video', () => {
    expect(filterDrills(drills, { ...emptyFilters, query: 'リズムジャンプ' }).map((drill) => drill.id)).toContain('move-18')
    expect(filterDrills(drills, { ...emptyFilters, query: 'ラインジャンプ' }).map((drill) => drill.id)).toContain('move-18')
    expect(sourceById.get('abetake-rhythm-training-short')?.url).toBe(
      'https://www.youtube.com/shorts/rljcqmIHKCc',
    )
  })

  it('loads the sprint drill set and its reference video', () => {
    const drill = filterDrills(drills, { ...emptyFilters, query: '膝抜きジャンプ' })
      .find((item) => item.id === 'phy-rfd-13')

    expect(drill?.steps).toHaveLength(10)
    expect(filterDrills(drills, { ...emptyFilters, query: '足が速くなる' }).map((item) => item.id)).toContain('phy-rfd-13')
    expect(sourceById.get('kazuni-sprint-drills-short')?.url).toBe(
      'https://www.youtube.com/shorts/k43UtIyGu5Q',
    )
  })

  it('loads the single-leg depth to lateral bound as an advanced derived drill', () => {
    const drill = filterDrills(drills, { ...emptyFilters, query: 'ラテラルデプスジャンプ' })
      .find((item) => item.id === 'phy-rfd-14')

    expect(drill?.status).toBe('derived')
    expect(drill?.category).toEqual(['フィジカル', 'RFD・プライオメトリクス', '側方片脚'])
    expect(drill?.regressions).toContain('台を外し、スケーターバウンド＆スティックへ戻す。')
    expect(drill?.safetyNotes?.[0]).toContain('初心者は行わず')
    expect(sourceById.get('nsca-stretch-shortening-cycle')?.url).toBe(
      'https://www.nsca.com/education/articles/kinetic-select/stretch-shortening-cycle/',
    )
  })

  it('finds the D1 session by exercise name and resolves its video', () => {
    const results = filterDrills(drills, {
      ...emptyFilters,
      query: 'ケトルベルウィンドミル',
      category: 'フィジカル',
      environment: 'gym',
    })
    const session = results.find((drill) => drill.id === 'phy-session-01')

    expect(session).toBeDefined()
    expect(session?.media).toEqual(['ascend-d1-tennis-session'])
    expect(session?.sources).toEqual(session?.media)
    expect(sourceById.get(session!.media[0])?.url).toBe(
      'https://www.youtube.com/watch?v=xTa3Fb9rZeI',
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
