import type { CatalogIndex, CourtDiagram, Drill, MediaSource } from '../types/catalog.ts'

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ACTOR_ROLES = new Set(['player', 'opponent', 'feeder'])
const PATH_TYPES = new Set(['ball', 'movement'])
const TARGET_SHAPES = new Set(['rect', 'ellipse', 'polygon'])

type ValidationContext = {
  catalog: CatalogIndex
  drills: Drill[]
  sources: MediaSource[]
  originalId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function inCourt(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
}

function validateDiagram(value: unknown, errors: string[]): value is CourtDiagram {
  if (!isRecord(value) || value.orientation !== 'vertical' || !Array.isArray(value.phases) || value.phases.length === 0) {
    errors.push('コート図には1つ以上の縦向きフェーズが必要です。')
    return false
  }

  value.phases.forEach((phase, phaseIndex) => {
    const prefix = `フェーズ${phaseIndex + 1}`
    if (!isRecord(phase) || !isText(phase.label)) {
      errors.push(`${prefix}の名前が必要です。`)
      return
    }
    if (![phase.actors, phase.equipment, phase.paths, phase.targets].every(Array.isArray)) {
      errors.push(`${prefix}の配置データが不正です。`)
      return
    }

    const actors = phase.actors as unknown[]
    const equipment = phase.equipment as unknown[]
    const paths = phase.paths as unknown[]
    const targets = phase.targets as unknown[]
    const actorIds = new Set<string>()
    actors.forEach((actor, index) => {
      if (!isRecord(actor) || !isText(actor.id) || !ACTOR_ROLES.has(String(actor.role)) || !inCourt(actor.x) || !inCourt(actor.y)) {
        errors.push(`${prefix}の選手${index + 1}が不正です。`)
        return
      }
      if (actorIds.has(actor.id)) errors.push(`${prefix}内で選手ID「${actor.id}」が重複しています。`)
      actorIds.add(actor.id)
    })

    equipment.forEach((item, index) => {
      if (!isRecord(item) || !isText(item.type) || !inCourt(item.x) || !inCourt(item.y)) {
        errors.push(`${prefix}の用具${index + 1}が不正です。`)
      }
    })

    const orders = new Set<number>()
    paths.forEach((path, index) => {
      if (!isRecord(path)) {
        errors.push(`${prefix}の軌道${index + 1}が不正です。`)
        return
      }
      if (!PATH_TYPES.has(String(path.type)) || !Array.isArray(path.points) || path.points.length < 2 || !path.points.every((point) => Array.isArray(point) && point.length === 2 && inCourt(point[0]) && inCourt(point[1]))) {
        errors.push(`${prefix}の軌道${index + 1}にはコート内の点が2つ以上必要です。`)
      }
      if (path.order !== undefined) {
        if (!Number.isInteger(path.order) || Number(path.order) < 1) errors.push(`${prefix}の軌道順序は1以上の整数にしてください。`)
        else if (orders.has(Number(path.order))) errors.push(`${prefix}内で軌道順序${path.order}が重複しています。`)
        else orders.add(Number(path.order))
      }
    })

    targets.forEach((target, index) => {
      if (!isRecord(target) || !TARGET_SHAPES.has(String(target.shape)) || !Array.isArray(target.points) || !target.points.every((point) => Array.isArray(point) && point.length === 2 && inCourt(point[0]) && inCourt(point[1]))) {
        errors.push(`${prefix}の狙い${index + 1}が不正です。`)
        return
      }
      const required = target.shape === 'polygon' ? 3 : 2
      if (target.points.length < required) errors.push(`${prefix}の${target.shape}には${required}点以上必要です。`)
    })
  })
  return errors.length === 0
}

export function validateDrill(value: unknown, context: ValidationContext): string[] {
  const errors: string[] = []
  if (!isRecord(value)) return ['練習データがオブジェクトではありません。']
  if (!isText(value.id) || !ID_PATTERN.test(value.id)) errors.push('IDは英小文字・数字・ハイフンで入力してください。')
  if (isText(value.id) && value.id !== context.originalId && context.drills.some((drill) => drill.id === value.id)) errors.push(`ID「${value.id}」は既に使われています。`)
  if (!isText(value.name)) errors.push('練習名が必要です。')
  if (!isText(value.summary)) errors.push('概要が必要です。')
  if (!Array.isArray(value.category) || value.category.length < 2 || value.category.length > 3 || !value.category.every(isText)) errors.push('カテゴリは大分類と中分類を指定してください。')
  else {
    const category = value.category as string[]
    if (!context.catalog.files.some((file) => file.label === category[0])) errors.push('大分類がカタログに存在しません。')
  }

  const arrayFields = ['disciplines', 'formats', 'environments', 'equipment', 'tags', 'cues', 'media', 'sources'] as const
  arrayFields.forEach((field) => {
    if (!isStringArray(value[field])) errors.push(`${field}は文字列の配列にしてください。`)
  })
  const optionalArrays = ['aliases', 'purposes', 'setup', 'steps', 'successCriteria', 'commonErrors', 'safetyNotes', 'progressions', 'regressions'] as const
  optionalArrays.forEach((field) => {
    if (value[field] !== undefined && !isStringArray(value[field])) errors.push(`${field}は文字列の配列にしてください。`)
  })

  if (!isRecord(value.playerCount) || !Number.isInteger(value.playerCount.min) || Number(value.playerCount.min) < 1 || (value.playerCount.max !== undefined && (!Number.isInteger(value.playerCount.max) || Number(value.playerCount.max) < Number(value.playerCount.min)))) {
    errors.push('人数は1以上で、最大人数を最小人数以上にしてください。')
  }
  if (!isRecord(value.durationMinutes) || !Number.isFinite(value.durationMinutes.min) || !Number.isFinite(value.durationMinutes.max) || Number(value.durationMinutes.min) < 1 || Number(value.durationMinutes.max) < Number(value.durationMinutes.min)) {
    errors.push('時間は1分以上で、最大時間を最小時間以上にしてください。')
  }
  if (!['low', 'medium', 'high'].includes(String(value.intensity))) errors.push('強度が不正です。')
  if (!['researched', 'derived', 'draft'].includes(String(value.status))) errors.push('ステータスが不正です。')
  if (Array.isArray(value.disciplines) && !value.disciplines.every((item) => ['singles', 'doubles', 'both'].includes(String(item)))) errors.push('種目が不正です。')

  const sourceIds = new Set(context.sources.map((source) => source.id))
  ;[...(Array.isArray(value.media) ? value.media : []), ...(Array.isArray(value.sources) ? value.sources : [])].forEach((id) => {
    if (typeof id === 'string' && !sourceIds.has(id)) errors.push(`参考資料「${id}」が資料マスターに存在しません。`)
  })

  if (value.diagram !== undefined) validateDiagram(value.diagram, errors)
  if (value.image !== undefined && (!isRecord(value.image) || !isText(value.image.src) || !isText(value.image.alt))) errors.push('画像にはsrcとaltが必要です。')
  return [...new Set(errors)]
}

export function validateSource(value: unknown, sources: MediaSource[], originalId?: string): string[] {
  if (!isRecord(value)) return ['参考資料がオブジェクトではありません。']
  const errors: string[] = []
  if (!isText(value.id) || !ID_PATTERN.test(value.id)) errors.push('IDは英小文字・数字・ハイフンで入力してください。')
  if (isText(value.id) && value.id !== originalId && sources.some((source) => source.id === value.id)) errors.push(`ID「${value.id}」は既に使われています。`)
  ;['title', 'organization', 'kind', 'note'].forEach((field) => {
    if (!isText(value[field])) errors.push(`${field}が必要です。`)
  })
  if (!isText(value.url)) errors.push('URLが必要です。')
  else {
    try {
      const url = new URL(value.url)
      if (!['http:', 'https:'].includes(url.protocol)) errors.push('URLはhttpまたはhttpsにしてください。')
    } catch {
      errors.push('URLの形式が不正です。')
    }
  }
  return errors
}

export function sourceUsage(sourceId: string, drills: Drill[]): Array<{ id: string; name: string }> {
  return drills.filter((drill) => drill.media.includes(sourceId) || drill.sources.includes(sourceId)).map(({ id, name }) => ({ id, name }))
}
