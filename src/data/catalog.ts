import rawCatalog from '../../data/catalog.json'
import rawSources from '../../data/sources.json'
import type { CatalogIndex, Drill, MediaSource } from '../types/catalog'

const drillFiles = import.meta.glob<Drill[]>('../../data/drills/*.json', {
  eager: true,
  import: 'default',
})

export const catalogIndex = rawCatalog as CatalogIndex

export const drills: Drill[] = catalogIndex.files.flatMap((file) => {
  const moduleKey = `../../data/${file.path.replaceAll('\\', '/')}`
  return drillFiles[moduleKey] ?? []
})

export const drillById = new Map(drills.map((drill) => [drill.id, drill]))
export const categoryByLabel = new Map(
  catalogIndex.files.map((category) => [category.label, category]),
)

const sourceList = (rawSources as { sources: MediaSource[] }).sources
export const sourceById = new Map(sourceList.map((source) => [source.id, source]))

export const catalogFacets = {
  categories: catalogIndex.files.map((category) => category.label),
  disciplines: ['singles', 'doubles', 'both'] as const,
  formats: [...new Set(drills.flatMap((drill) => drill.formats))].toSorted(),
  environments: [...new Set(drills.flatMap((drill) => drill.environments))].toSorted(),
  equipment: [...new Set(drills.flatMap((drill) => drill.equipment))].toSorted(),
}

if (import.meta.env.DEV && drills.length !== catalogIndex.totalDrills) {
  console.warn(
    `Catalog count mismatch: expected ${catalogIndex.totalDrills}, received ${drills.length}`,
  )
}
