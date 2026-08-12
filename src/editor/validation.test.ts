import { describe, expect, it } from 'vitest'
import { emptyDrill } from './editor-helpers'
import { validateDrill, validateSource } from './validation'
import type { CatalogIndex, MediaSource } from '../types/catalog'

const catalog: CatalogIndex = {
  version: 1,
  updatedAt: '2026-08-11',
  target: 'competitive',
  totalDrills: 0,
  files: [{ id: 'technical', label: '技術', color: '#2563eb', path: 'drills/technical.json', count: 0 }],
  notes: [],
}

const source: MediaSource = { id: 'source-one', title: 'Source', organization: 'Org', kind: 'article', url: 'https://example.com', note: 'Note' }

describe('editor validation', () => {
  it('accepts a complete multi-phase court diagram', () => {
    const drill = emptyDrill()
    Object.assign(drill, { id: 'test-drill', name: 'テスト', summary: '概要', cues: ['確認'], sources: ['source-one'] })
    drill.diagram = {
      orientation: 'vertical',
      phases: [{
        label: '開始',
        actors: [{ id: 'p1', role: 'player', x: 50, y: 80 }],
        equipment: [{ type: 'cone', x: 20, y: 20 }],
        paths: [{ type: 'ball', points: [[50, 80], [50, 20]], order: 1 }],
        targets: [
          { shape: 'rect', points: [[20, 10], [40, 30]] },
          { shape: 'ellipse', points: [[50, 10], [70, 30]] },
          { shape: 'polygon', points: [[20, 40], [30, 50], [10, 50]] },
        ],
      }],
    }
    expect(validateDrill(drill, { catalog, drills: [], sources: [source] })).toEqual([])
  })

  it('reports duplicate actor/order, invalid geometry, and missing sources', () => {
    const drill = emptyDrill()
    Object.assign(drill, { id: 'test-drill', name: 'テスト', summary: '概要', cues: [], sources: ['missing'] })
    drill.diagram = {
      orientation: 'vertical',
      phases: [{
        label: '開始',
        actors: [{ id: 'p1', role: 'player', x: 50, y: 80 }, { id: 'p1', role: 'opponent', x: 50, y: 20 }],
        equipment: [],
        paths: [{ type: 'ball', points: [[50, 80]], order: 1 }, { type: 'movement', points: [[10, 10], [20, 20]], order: 1 }],
        targets: [{ shape: 'polygon', points: [[10, 10], [20, 20]] }],
      }],
    }
    const errors = validateDrill(drill, { catalog, drills: [], sources: [] })
    expect(errors.join(' ')).toMatch(/重複/)
    expect(errors.join(' ')).toMatch(/2つ以上/)
    expect(errors.join(' ')).toMatch(/3点以上/)
    expect(errors.join(' ')).toMatch(/資料マスター/)
  })

  it('validates source identity and URL', () => {
    expect(validateSource({ ...source, id: 'Bad ID', url: 'file:///tmp/source' }, [], undefined)).toHaveLength(2)
    expect(validateSource(source, [], undefined)).toEqual([])
  })
})
