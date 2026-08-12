import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { CatalogIndex, Drill, MediaSource } from '../src/types/catalog.ts'
import { sourceUsage, validateDrill, validateSource } from '../src/editor/validation.ts'
import type { EditorSnapshot } from '../src/editor/api.ts'

const API_PREFIX = '/__tennis-check-editor'
const MAX_BODY_BYTES = 2_000_000

type SourceFile = { version: number; checkedAt: string; sources: MediaSource[] }
function revision(text: string) {
  return createHash('sha256').update(text).digest('hex')
}

function todayInTokyo() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date())
}

function jsonText(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function insideRoot(root: string, path: string) {
  const relation = relative(root, path)
  return relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation)
}

export class EditorRepository {
  readonly root: string
  readonly dataRoot: string
  readonly catalogPath: string
  readonly sourcesPath: string
  private commitQueue = Promise.resolve()

  constructor(root: string) {
    this.root = resolve(root)
    this.dataRoot = resolve(this.root, 'data')
    this.catalogPath = resolve(this.dataRoot, 'catalog.json')
    this.sourcesPath = resolve(this.dataRoot, 'sources.json')
  }

  private async readJson<T>(path: string): Promise<{ value: T; text: string; revision: string }> {
    const text = await readFile(path, 'utf8')
    return { value: JSON.parse(text) as T, text, revision: revision(text) }
  }

  private categoryPath(catalog: CatalogIndex, categoryId: string) {
    const category = catalog.files.find((file) => file.id === categoryId)
    if (!category) throw Object.assign(new Error('カテゴリが見つかりません。'), { status: 404 })
    const path = resolve(this.dataRoot, category.path)
    if (!insideRoot(this.dataRoot, path)) throw Object.assign(new Error('不正なデータパスです。'), { status: 400 })
    return { category, path }
  }

  async snapshot(): Promise<EditorSnapshot> {
    const [catalogFile, sourcesFile] = await Promise.all([
      this.readJson<CatalogIndex>(this.catalogPath),
      this.readJson<SourceFile>(this.sourcesPath),
    ])
    const categories = await Promise.all(catalogFile.value.files.map(async (category) => {
      const path = resolve(this.dataRoot, category.path)
      if (!insideRoot(this.dataRoot, path)) throw new Error('カタログ内のデータパスが不正です。')
      const file = await this.readJson<Drill[]>(path)
      return { id: category.id, label: category.label, path: category.path, revision: file.revision, drills: file.value }
    }))
    return {
      catalog: catalogFile.value,
      catalogRevision: catalogFile.revision,
      categories,
      sources: sourcesFile.value,
      sourcesRevision: sourcesFile.revision,
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.commitQueue.then(operation, operation)
    this.commitQueue = result.then(() => undefined, () => undefined)
    return result
  }

  private assertRevision(actual: string, expected?: string) {
    if (!expected || actual !== expected) throw Object.assign(new Error('ファイルが外部で更新されました。再読み込みしてください。'), { status: 409 })
  }

  private async replaceFiles(files: Array<{ path: string; value: unknown }>) {
    const originals = await Promise.all(files.map(async (file) => ({ ...file, text: await readFile(file.path, 'utf8') })))
    const prepared = await Promise.all(files.map(async (file) => {
      const temporary = `${file.path}.${randomUUID()}.tmp`
      await mkdir(dirname(file.path), { recursive: true })
      await writeFile(temporary, jsonText(file.value), 'utf8')
      return { ...file, temporary }
    }))
    const replaced: typeof prepared = []
    try {
      for (const file of prepared) {
        await rename(file.temporary, file.path)
        replaced.push(file)
      }
    } catch (error) {
      for (const file of replaced) {
        const original = originals.find((item) => item.path === file.path)
        if (original) await writeFile(file.path, original.text, 'utf8')
      }
      await Promise.all(prepared.map((file) => rm(file.temporary, { force: true })))
      throw error
    }
  }

  async createDrill(input: { categoryId: string; drill: Drill; expectedRevision: string; expectedCatalogRevision: string }) {
    return this.enqueue(async () => {
      const snapshot = await this.snapshot()
      const categorySnapshot = snapshot.categories.find((category) => category.id === input.categoryId)
      if (!categorySnapshot) throw Object.assign(new Error('カテゴリが見つかりません。'), { status: 404 })
      this.assertRevision(categorySnapshot.revision, input.expectedRevision)
      this.assertRevision(snapshot.catalogRevision, input.expectedCatalogRevision)
      const drills = snapshot.categories.flatMap((category) => category.drills)
      const errors = validateDrill(input.drill, { catalog: snapshot.catalog, drills, sources: snapshot.sources.sources })
      if (input.drill.category[0] !== categorySnapshot.label) errors.push('保存先カテゴリと練習の大分類が一致しません。')
      if (errors.length) throw Object.assign(new Error(errors.join('\n')), { status: 422, errors })
      const nextDrills = [...categorySnapshot.drills, input.drill]
      const nextCatalog = structuredClone(snapshot.catalog)
      const meta = nextCatalog.files.find((file) => file.id === input.categoryId)!
      meta.count = nextDrills.length
      nextCatalog.totalDrills = nextCatalog.files.reduce((sum, file) => sum + file.count, 0)
      nextCatalog.updatedAt = todayInTokyo()
      const { path } = this.categoryPath(nextCatalog, input.categoryId)
      await this.replaceFiles([{ path, value: nextDrills }, { path: this.catalogPath, value: nextCatalog }])
      return this.snapshot()
    })
  }

  async updateDrill(id: string, input: { categoryId: string; drill: Drill; expectedRevision: string; expectedCatalogRevision: string }) {
    return this.enqueue(async () => {
      const snapshot = await this.snapshot()
      const categorySnapshot = snapshot.categories.find((category) => category.id === input.categoryId)
      if (!categorySnapshot) throw Object.assign(new Error('カテゴリが見つかりません。'), { status: 404 })
      this.assertRevision(categorySnapshot.revision, input.expectedRevision)
      this.assertRevision(snapshot.catalogRevision, input.expectedCatalogRevision)
      const index = categorySnapshot.drills.findIndex((drill) => drill.id === id)
      if (index < 0) throw Object.assign(new Error('練習が見つかりません。'), { status: 404 })
      const current = categorySnapshot.drills[index]
      if (input.drill.id !== id || input.drill.category[0] !== current.category[0]) throw Object.assign(new Error('既存項目のIDと大分類は変更できません。'), { status: 422 })
      const drills = snapshot.categories.flatMap((category) => category.drills)
      const errors = validateDrill(input.drill, { catalog: snapshot.catalog, drills, sources: snapshot.sources.sources, originalId: id })
      if (errors.length) throw Object.assign(new Error(errors.join('\n')), { status: 422, errors })
      const nextDrills = [...categorySnapshot.drills]
      nextDrills[index] = input.drill
      const nextCatalog = { ...snapshot.catalog, updatedAt: todayInTokyo() }
      const { path } = this.categoryPath(nextCatalog, input.categoryId)
      await this.replaceFiles([{ path, value: nextDrills }, { path: this.catalogPath, value: nextCatalog }])
      return this.snapshot()
    })
  }

  async deleteDrill(id: string, input: { categoryId: string; expectedRevision: string; expectedCatalogRevision: string }) {
    return this.enqueue(async () => {
      const snapshot = await this.snapshot()
      const categorySnapshot = snapshot.categories.find((category) => category.id === input.categoryId)
      if (!categorySnapshot) throw Object.assign(new Error('カテゴリが見つかりません。'), { status: 404 })
      this.assertRevision(categorySnapshot.revision, input.expectedRevision)
      this.assertRevision(snapshot.catalogRevision, input.expectedCatalogRevision)
      if (!categorySnapshot.drills.some((drill) => drill.id === id)) throw Object.assign(new Error('練習が見つかりません。'), { status: 404 })
      const nextDrills = categorySnapshot.drills.filter((drill) => drill.id !== id)
      const nextCatalog = structuredClone(snapshot.catalog)
      const meta = nextCatalog.files.find((file) => file.id === input.categoryId)!
      meta.count = nextDrills.length
      nextCatalog.totalDrills = nextCatalog.files.reduce((sum, file) => sum + file.count, 0)
      nextCatalog.updatedAt = todayInTokyo()
      const { path } = this.categoryPath(nextCatalog, input.categoryId)
      await this.replaceFiles([{ path, value: nextDrills }, { path: this.catalogPath, value: nextCatalog }])
      return this.snapshot()
    })
  }

  async saveSource(id: string | undefined, input: { source: MediaSource; expectedRevision: string; expectedCatalogRevision: string }) {
    return this.enqueue(async () => {
      const snapshot = await this.snapshot()
      this.assertRevision(snapshot.sourcesRevision, input.expectedRevision)
      this.assertRevision(snapshot.catalogRevision, input.expectedCatalogRevision)
      const errors = validateSource(input.source, snapshot.sources.sources, id)
      if (id && input.source.id !== id) errors.push('既存資料のIDは変更できません。')
      if (errors.length) throw Object.assign(new Error(errors.join('\n')), { status: 422, errors })
      const nextSources = structuredClone(snapshot.sources)
      if (id) {
        const index = nextSources.sources.findIndex((source) => source.id === id)
        if (index < 0) throw Object.assign(new Error('参考資料が見つかりません。'), { status: 404 })
        nextSources.sources[index] = input.source
      } else nextSources.sources.push(input.source)
      nextSources.checkedAt = todayInTokyo()
      const nextCatalog = { ...snapshot.catalog, updatedAt: todayInTokyo() }
      await this.replaceFiles([{ path: this.sourcesPath, value: nextSources }, { path: this.catalogPath, value: nextCatalog }])
      return this.snapshot()
    })
  }

  async deleteSource(id: string, input: { expectedRevision: string; expectedCatalogRevision: string }) {
    return this.enqueue(async () => {
      const snapshot = await this.snapshot()
      this.assertRevision(snapshot.sourcesRevision, input.expectedRevision)
      this.assertRevision(snapshot.catalogRevision, input.expectedCatalogRevision)
      const usage = sourceUsage(id, snapshot.categories.flatMap((category) => category.drills))
      if (usage.length) throw Object.assign(new Error(`この資料は${usage.length}件の練習で使用中です。`), { status: 409, usage })
      if (!snapshot.sources.sources.some((source) => source.id === id)) throw Object.assign(new Error('参考資料が見つかりません。'), { status: 404 })
      const nextSources = { ...snapshot.sources, checkedAt: todayInTokyo(), sources: snapshot.sources.sources.filter((source) => source.id !== id) }
      const nextCatalog = { ...snapshot.catalog, updatedAt: todayInTokyo() }
      await this.replaceFiles([{ path: this.sourcesPath, value: nextSources }, { path: this.catalogPath, value: nextCatalog }])
      return this.snapshot()
    })
  }
}

async function readBody(request: IncomingMessage) {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('リクエストが大きすぎます。'), { status: 413 })
    chunks.push(buffer)
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown> : {}
}

function send(response: ServerResponse, status: number, value: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(value))
}

function isLoopback(request: IncomingMessage) {
  const remote = request.socket.remoteAddress ?? ''
  const remoteOk = remote === '127.0.0.1' || remote === '::1' || remote.endsWith(':127.0.0.1')
  const rawHost = request.headers.host ?? ''
  const hostname = rawHost.startsWith('[') ? rawHost.slice(1, rawHost.indexOf(']')) : rawHost.split(':')[0]
  const hostOk = ['localhost', '127.0.0.1', '::1'].includes(hostname)
  const origin = request.headers.origin
  let originOk = true
  if (origin) {
    try { originOk = ['localhost', '127.0.0.1', '::1'].includes(new URL(origin).hostname) } catch { originOk = false }
  }
  return remoteOk && hostOk && originOk
}

export function editorDataPlugin(root = process.cwd()): Plugin {
  const repository = new EditorRepository(root)
  return {
    name: 'tennis-check-editor-data',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith(API_PREFIX)) return next()
        if (!isLoopback(request)) return send(response, 403, { error: '編集APIはローカルホストからのみ利用できます。' })
        try {
          const route = url.pathname.slice(API_PREFIX.length)
          if (request.method === 'GET' && route === '/snapshot') return send(response, 200, await repository.snapshot())
          const drillMatch = route.match(/^\/drills(?:\/([^/]+))?$/)
          const sourceMatch = route.match(/^\/sources(?:\/([^/]+))?$/)
          const body = await readBody(request)
          let result: EditorSnapshot
          if (drillMatch && request.method === 'POST' && !drillMatch[1]) result = await repository.createDrill(body as Parameters<EditorRepository['createDrill']>[0])
          else if (drillMatch?.[1] && request.method === 'PUT') result = await repository.updateDrill(decodeURIComponent(drillMatch[1]), body as Parameters<EditorRepository['updateDrill']>[1])
          else if (drillMatch?.[1] && request.method === 'DELETE') result = await repository.deleteDrill(decodeURIComponent(drillMatch[1]), body as Parameters<EditorRepository['deleteDrill']>[1])
          else if (sourceMatch && request.method === 'POST' && !sourceMatch[1]) result = await repository.saveSource(undefined, body as Parameters<EditorRepository['saveSource']>[1])
          else if (sourceMatch?.[1] && request.method === 'PUT') result = await repository.saveSource(decodeURIComponent(sourceMatch[1]), body as Parameters<EditorRepository['saveSource']>[1])
          else if (sourceMatch?.[1] && request.method === 'DELETE') result = await repository.deleteSource(decodeURIComponent(sourceMatch[1]), body as Parameters<EditorRepository['deleteSource']>[1])
          else return send(response, 404, { error: '編集APIが見つかりません。' })
          return send(response, 200, result)
        } catch (error) {
          const detail = error as Error & { status?: number; errors?: string[]; usage?: unknown }
          return send(response, detail.status ?? 500, { error: detail.message || '保存に失敗しました。', errors: detail.errors, usage: detail.usage })
        }
      })
    },
  }
}
