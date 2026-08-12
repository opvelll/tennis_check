import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EditorRepository } from './editor-data-plugin'
import { emptyDrill } from '../src/editor/editor-helpers'
import type { CatalogIndex, MediaSource } from '../src/types/catalog'

let root = ''

const source: MediaSource = { id: 'source-one', title: 'Source', organization: 'Org', kind: 'article', url: 'https://example.com', note: 'Note' }

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'tennis-check-editor-'))
  await mkdir(join(root, 'data', 'drills'), { recursive: true })
  const catalog: CatalogIndex = {
    version: 1, updatedAt: '2026-08-11', target: 'competitive', totalDrills: 1,
    files: [{ id: 'technical', label: '技術', color: '#2563eb', path: 'drills/technical.json', count: 1 }], notes: [],
  }
  const drill = emptyDrill()
  Object.assign(drill, { id: 'existing-drill', name: '既存', summary: '概要', cues: ['確認'], sources: ['source-one'] })
  await writeFile(join(root, 'data', 'catalog.json'), JSON.stringify(catalog), 'utf8')
  await writeFile(join(root, 'data', 'sources.json'), JSON.stringify({ version: 1, checkedAt: '2026-08-11', sources: [source] }), 'utf8')
  await writeFile(join(root, 'data', 'drills', 'technical.json'), JSON.stringify([drill]), 'utf8')
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('EditorRepository', () => {
  it('creates, updates and deletes drills while maintaining catalog counts', async () => {
    const repository = new EditorRepository(root)
    let snapshot = await repository.snapshot()
    const created = emptyDrill()
    Object.assign(created, { id: 'new-drill', name: '新規', summary: '概要', cues: ['確認'] })
    snapshot = await repository.createDrill({ categoryId: 'technical', drill: created, expectedRevision: snapshot.categories[0].revision, expectedCatalogRevision: snapshot.catalogRevision })
    expect(snapshot.catalog.totalDrills).toBe(2)
    expect(snapshot.categories[0].drills).toHaveLength(2)
    const updated = { ...created, name: '更新済み' }
    snapshot = await repository.updateDrill('new-drill', { categoryId: 'technical', drill: updated, expectedRevision: snapshot.categories[0].revision, expectedCatalogRevision: snapshot.catalogRevision })
    expect(snapshot.categories[0].drills[1].name).toBe('更新済み')
    snapshot = await repository.deleteDrill('new-drill', { categoryId: 'technical', expectedRevision: snapshot.categories[0].revision, expectedCatalogRevision: snapshot.catalogRevision })
    expect(snapshot.catalog.totalDrills).toBe(1)
    expect((await readFile(join(root, 'data', 'drills', 'technical.json'), 'utf8')).endsWith('\n')).toBe(true)
  })

  it('rejects stale revisions and deletion of a referenced source', async () => {
    const repository = new EditorRepository(root)
    const snapshot = await repository.snapshot()
    const created = emptyDrill()
    Object.assign(created, { id: 'new-drill', name: '新規', summary: '概要', cues: ['確認'] })
    await writeFile(join(root, 'data', 'drills', 'technical.json'), '[]\n', 'utf8')
    await expect(repository.createDrill({ categoryId: 'technical', drill: created, expectedRevision: snapshot.categories[0].revision, expectedCatalogRevision: snapshot.catalogRevision })).rejects.toMatchObject({ status: 409 })
    const fresh = await repository.snapshot()
    await expect(repository.deleteSource('source-one', { expectedRevision: fresh.sourcesRevision, expectedCatalogRevision: fresh.catalogRevision })).resolves.toBeDefined()
  })

  it('blocks deleting a source that is still referenced', async () => {
    const repository = new EditorRepository(root)
    const snapshot = await repository.snapshot()
    await expect(repository.deleteSource('source-one', { expectedRevision: snapshot.sourcesRevision, expectedCatalogRevision: snapshot.catalogRevision })).rejects.toMatchObject({ status: 409 })
  })
})
