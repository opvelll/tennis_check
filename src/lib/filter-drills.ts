import type { Discipline, Drill, Intensity } from '../types/catalog'

export type DrillFilters = {
  query: string
  category: string
  discipline: Discipline | ''
  format: string
  playerCount: number | null
  environment: string
  intensity: Intensity | ''
  maxDuration: number | null
}

export const emptyFilters: DrillFilters = {
  query: '',
  category: '',
  discipline: '',
  format: '',
  playerCount: null,
  environment: '',
  intensity: '',
  maxDuration: null,
}

export function normalizeSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ja').trim()
}

function matchesPlayerCount(drill: Drill, availablePlayers: number) {
  const max = drill.playerCount.max ?? Number.POSITIVE_INFINITY
  return drill.playerCount.min <= availablePlayers && availablePlayers <= max
}

export function filterDrills(items: Drill[], filters: DrillFilters) {
  const query = normalizeSearchText(filters.query)

  return items.filter((drill) => {
    if (query) {
      const searchable = normalizeSearchText(
        [
          drill.name,
          ...(drill.aliases ?? []),
          drill.summary,
          ...drill.category,
          ...drill.tags,
          ...drill.cues,
        ].join(' '),
      )
      if (!searchable.includes(query)) return false
    }

    if (filters.category && drill.category[0] !== filters.category) return false
    if (
      filters.discipline &&
      !drill.disciplines.includes(filters.discipline) &&
      !drill.disciplines.includes('both')
    ) {
      return false
    }
    if (filters.format && !drill.formats.includes(filters.format)) return false
    if (
      filters.playerCount !== null &&
      !matchesPlayerCount(drill, filters.playerCount)
    ) {
      return false
    }
    if (filters.environment && !drill.environments.includes(filters.environment)) {
      return false
    }
    if (filters.intensity && drill.intensity !== filters.intensity) return false
    if (
      filters.maxDuration !== null &&
      drill.durationMinutes.max > filters.maxDuration
    ) {
      return false
    }

    return true
  })
}
