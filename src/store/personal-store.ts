import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const DEFAULT_DRILL_IDS = [
  'tech-fh-01',
  'tech-fh-05',
  'tech-fh-07',
  'tech-net-01',
  'tech-bh-01',
  'tech-bh-06',
  'tech-bh-08',
  'tech-serve-01',
  'tech-serve-06',
  'tech-serve-07',
  'tech-return-01',
  'tech-return-03',
  'move-01',
  'move-03',
  'move-05',
  'move-07',
  'move-10',
  'tac-s-01',
  'tac-s-02',
  'tac-s-03',
  'tac-s-05',
  'tac-s-06',
  'phy-rfd-02',
  'phy-rfd-06',
  'phy-strength-02',
  'phy-strength-03',
  'phy-strength-05',
  'prep-01',
  'mental-01',
  'mental-02',
] as const

export type CompletionRecord = {
  lastCompletedAt?: string
  completedCount: number
  fadeDaysOverride?: number
  personalNote?: string
}

export type PersonalState = {
  schemaVersion: 1
  initialized: boolean
  setup: {
    id: 'singles-default'
    name: string
    drillIds: string[]
  }
  records: Record<string, CompletionRecord>
  settings: {
    defaultFadeDays: number
    fadeMultiplier: 0.5 | 1 | 1.5 | 2
  }
  addDrill: (drillId: string) => void
  removeDrill: (drillId: string) => void
  markCompleted: (drillId: string, completedAt?: string) => void
  restoreRecord: (drillId: string, record?: CompletionRecord) => void
  setFadeDaysOverride: (drillId: string, days?: number) => void
  setPersonalNote: (drillId: string, note: string) => void
  setDefaultFadeDays: (days: number) => void
  setFadeMultiplier: (multiplier: 0.5 | 1 | 1.5 | 2) => void
}

const initialData: Pick<
  PersonalState,
  'schemaVersion' | 'initialized' | 'setup' | 'records' | 'settings'
> = {
  schemaVersion: 1 as const,
  initialized: true,
  setup: {
    id: 'singles-default' as const,
    name: '標準セット',
    drillIds: [...DEFAULT_DRILL_IDS] as string[],
  },
  records: {},
  settings: {
    defaultFadeDays: 3,
    fadeMultiplier: 1 as const,
  },
}

export const usePersonalStore = create<PersonalState>()(
  persist(
    (set) => ({
      ...initialData,
      addDrill: (drillId) =>
        set((state) => {
          if (state.setup.drillIds.includes(drillId)) return state
          return {
            setup: {
              ...state.setup,
              drillIds: [...state.setup.drillIds, drillId],
            },
          }
        }),
      removeDrill: (drillId) =>
        set((state) => ({
          setup: {
            ...state.setup,
            drillIds: state.setup.drillIds.filter((id) => id !== drillId),
          },
        })),
      markCompleted: (drillId, completedAt = new Date().toISOString()) =>
        set((state) => {
          const previous = state.records[drillId]
          return {
            records: {
              ...state.records,
              [drillId]: {
                ...previous,
                lastCompletedAt: completedAt,
                completedCount: (previous?.completedCount ?? 0) + 1,
              },
            },
          }
        }),
      restoreRecord: (drillId, record) =>
        set((state) => {
          const records = { ...state.records }
          if (record) records[drillId] = record
          else delete records[drillId]
          return { records }
        }),
      setFadeDaysOverride: (drillId, days) =>
        set((state) => ({
          records: {
            ...state.records,
            [drillId]: {
              ...state.records[drillId],
              completedCount: state.records[drillId]?.completedCount ?? 0,
              fadeDaysOverride: days,
            },
          },
        })),
      setPersonalNote: (drillId, note) =>
        set((state) => ({
          records: {
            ...state.records,
            [drillId]: {
              ...state.records[drillId],
              completedCount: state.records[drillId]?.completedCount ?? 0,
              personalNote: note,
            },
          },
        })),
      setDefaultFadeDays: (days) =>
        set((state) => ({
          settings: { ...state.settings, defaultFadeDays: days },
        })),
      setFadeMultiplier: (fadeMultiplier) =>
        set((state) => ({
          settings: { ...state.settings, fadeMultiplier },
        })),
    }),
    {
      name: 'tennis-check:personal:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        initialized: state.initialized,
        setup: state.setup,
        records: state.records,
        settings: state.settings,
      }),
      migrate: (persistedState) => persistedState as PersonalState,
    },
  ),
)
