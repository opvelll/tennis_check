import type { CourtPhase, Drill, MediaSource } from '../types/catalog'

export function clone<T>(value: T): T {
  return structuredClone(value)
}

export function emptyPhase(label = '開始配置'): CourtPhase {
  return { label, description: '', actors: [], equipment: [], paths: [], targets: [] }
}

export function emptyDrill(category: [string, string] = ['技術', '未分類']): Drill {
  return {
    id: '',
    name: '',
    aliases: [],
    category,
    summary: '',
    purposes: [],
    disciplines: ['both'],
    formats: [],
    playerCount: { min: 1 },
    environments: ['court'],
    equipment: ['racket', 'balls'],
    intensity: 'medium',
    durationMinutes: { min: 10, max: 20 },
    tags: [],
    setup: [],
    steps: [],
    cues: [],
    successCriteria: [],
    commonErrors: [],
    safetyNotes: [],
    progressions: [],
    regressions: [],
    media: [],
    sources: [],
    status: 'draft',
  }
}

export function duplicateDrill(drill: Drill): Drill {
  const next = clone(drill)
  next.id = ''
  next.name = `${drill.name}（コピー）`
  next.status = 'draft'
  return next
}

export function emptySource(): MediaSource {
  return { id: '', title: '', organization: '', kind: 'article', url: '', note: '' }
}

export function cleanDrill(drill: Drill): Drill {
  const next = clone(drill)
  const optionalArrays = ['aliases', 'purposes', 'setup', 'steps', 'successCriteria', 'commonErrors', 'safetyNotes', 'progressions', 'regressions'] as const
  optionalArrays.forEach((key) => {
    const values = next[key]?.map((value) => value.trim()).filter(Boolean)
    if (values?.length) next[key] = values
    else delete next[key]
  })
  next.formats = next.formats.map((value) => value.trim()).filter(Boolean)
  next.environments = next.environments.map((value) => value.trim()).filter(Boolean)
  next.equipment = next.equipment.map((value) => value.trim()).filter(Boolean)
  next.tags = next.tags.map((value) => value.trim()).filter(Boolean)
  next.cues = next.cues.map((value) => value.trim()).filter(Boolean)
  next.media = [...new Set(next.media)]
  next.sources = [...new Set(next.sources)]
  if (!next.diagram?.phases.length) delete next.diagram
  if (next.playerCount.max === undefined) delete next.playerCount.max
  if (!next.image?.src || !next.image.alt) delete next.image
  return next
}

export function nextActorId(phase: CourtPhase, role: string) {
  const prefix = role === 'player' ? 'p' : role === 'feeder' ? 'f' : 'o'
  let index = 1
  while (phase.actors.some((actor) => actor.id === `${prefix}${index}`)) index += 1
  return `${prefix}${index}`
}

export function clampCoordinate(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10
}
