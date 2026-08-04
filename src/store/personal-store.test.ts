import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_DRILL_IDS, usePersonalStore } from './personal-store'

describe('personal store', () => {
  beforeEach(() => {
    localStorage.clear()
    usePersonalStore.setState((state) => ({
      ...state,
      setup: { id: 'singles-default', name: '標準セット', drillIds: [...DEFAULT_DRILL_IDS] },
      records: {},
      settings: { defaultFadeDays: 3, fadeMultiplier: 1 },
    }))
  })

  it('starts with the curated 30-item singles setup', () => {
    expect(usePersonalStore.getState().setup.drillIds).toHaveLength(30)
    expect(new Set(usePersonalStore.getState().setup.drillIds).size).toBe(30)
  })

  it('adds and removes items without deleting completion history', () => {
    const state = usePersonalStore.getState()
    state.addDrill('tech-fh-02')
    state.markCompleted('tech-fh-02', '2026-08-04T00:00:00.000Z')
    usePersonalStore.getState().removeDrill('tech-fh-02')

    expect(usePersonalStore.getState().setup.drillIds).not.toContain('tech-fh-02')
    expect(usePersonalStore.getState().records['tech-fh-02']?.completedCount).toBe(1)
  })

  it('can restore the previous record after an accidental completion', () => {
    const previous = { completedCount: 2, lastCompletedAt: '2026-08-01T00:00:00.000Z' }
    usePersonalStore.setState({ records: { 'tech-fh-01': previous } })
    usePersonalStore.getState().markCompleted('tech-fh-01', '2026-08-04T00:00:00.000Z')
    usePersonalStore.getState().restoreRecord('tech-fh-01', previous)

    expect(usePersonalStore.getState().records['tech-fh-01']).toEqual(previous)
  })
})
