export type Discipline = 'singles' | 'doubles' | 'both'
export type Intensity = 'low' | 'medium' | 'high'

export type CourtPoint = [number, number]
export type CourtActorRole = 'player' | 'opponent' | 'feeder'

export type CourtActor = {
  id: string
  role: CourtActorRole
  label?: string
  x: number
  y: number
}

export type CourtEquipment = {
  type: string
  x: number
  y: number
  label?: string
}

export type CourtPath = {
  type: 'ball' | 'movement'
  points: CourtPoint[]
  order?: number
  showArrow?: boolean
}

export type CourtTarget = {
  shape: 'rect' | 'ellipse' | 'polygon'
  points: CourtPoint[]
  label?: string
}

export type CourtPhase = {
  label: string
  description?: string
  actors: CourtActor[]
  equipment: CourtEquipment[]
  paths: CourtPath[]
  targets: CourtTarget[]
}

export type CourtDiagram = {
  orientation: 'vertical'
  phases: CourtPhase[]
}

export type Drill = {
  id: string
  name: string
  aliases?: string[]
  category: [string, string, string?]
  summary: string
  purposes?: string[]
  disciplines: Discipline[]
  formats: string[]
  playerCount: { min: number; max?: number }
  environments: string[]
  equipment: string[]
  intensity: Intensity
  durationMinutes: { min: number; max: number }
  tags: string[]
  setup?: string[]
  steps?: string[]
  cues: string[]
  successCriteria?: string[]
  commonErrors?: string[]
  safetyNotes?: string[]
  progressions?: string[]
  regressions?: string[]
  diagram?: CourtDiagram
  image?: { src: string; alt: string; credit?: string }
  media: string[]
  sources: string[]
  status: 'researched' | 'derived' | 'draft'
}

export type CategoryMeta = {
  id: string
  label: string
  color: string
  path: string
  count: number
}

export type MediaSource = {
  id: string
  title: string
  organization: string
  kind: string
  url: string
  note: string
}

export type CatalogIndex = {
  version: number
  updatedAt: string
  target: string
  totalDrills: number
  files: CategoryMeta[]
  notes: string[]
}
