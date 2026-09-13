import { describe, expect, it } from 'vitest'
import rawSources from '../../data/sources.json'
import { validateDrill, validateSource } from '../editor/validation'
import type { Drill } from '../types/catalog'
import { catalogIndex, drills } from './catalog'

const sources = rawSources.sources
const files = import.meta.glob<Drill[]>('../../data/drills/*.json', {
  eager: true,
  import: 'default',
})

describe('committed catalog', () => {
  it('registers every category file exactly once with matching counts and labels', () => {
    const paths = catalogIndex.files.map((file) => `../../data/${file.path}`)
    expect([...paths].sort()).toEqual(Object.keys(files).sort())
    expect(new Set(catalogIndex.files.map((file) => file.id)).size).toBe(paths.length)
    expect(new Set(catalogIndex.files.map((file) => file.label)).size).toBe(paths.length)
    for (const file of catalogIndex.files) {
      const entries = files[`../../data/${file.path}`]
      expect(entries, file.path).toHaveLength(file.count)
      expect(entries.every((drill) => drill.category[0] === file.label), file.path).toBe(true)
    }
    expect(drills).toHaveLength(catalogIndex.totalDrills)
  })

  it('keeps drill and source IDs unique before building lookup maps', () => {
    expect(new Set(drills.map((drill) => drill.id)).size).toBe(drills.length)
    expect(new Set(sources.map((source) => source.id)).size).toBe(sources.length)
  })

  it('validates all saved drills and source references using editor rules', () => {
    for (const drill of drills) {
      expect(validateDrill(drill, {
        catalog: catalogIndex, drills, sources, originalId: drill.id,
      }), drill.id).toEqual([])
    }
    for (const source of sources) {
      expect(validateSource(source, sources, source.id), source.id).toEqual([])
    }
  })
})
