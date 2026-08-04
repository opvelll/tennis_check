export type Discipline = 'singles' | 'doubles' | 'both'
export type Intensity = 'low' | 'medium' | 'high'

export type CourtDiagram = {
  orientation: 'vertical'
  phases: Array<{
    label: string
    actors: Array<{ id: string; role: string; x: number; y: number }>
    equipment: Array<{ type: string; x: number; y: number; label?: string }>
    paths: Array<{
      type: 'ball' | 'movement'
      points: Array<[number, number]>
      order?: number
    }>
    targets: Array<{
      shape: 'rect' | 'ellipse' | 'polygon'
      points: Array<[number, number]>
      label?: string
    }>
  }>
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
