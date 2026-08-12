import type { CatalogIndex, Drill, MediaSource } from '../types/catalog'

export type EditorCategorySnapshot = {
  id: string
  label: string
  path: string
  revision: string
  drills: Drill[]
}

export type EditorSnapshot = {
  catalog: CatalogIndex
  catalogRevision: string
  categories: EditorCategorySnapshot[]
  sources: { version: number; checkedAt: string; sources: MediaSource[] }
  sourcesRevision: string
}

const API_PREFIX = '/__tennis-check-editor'

async function request(path: string, method = 'GET', body?: unknown): Promise<EditorSnapshot> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const result = await response.json() as EditorSnapshot & { error?: string; errors?: string[] }
  if (!response.ok) {
    const error = new Error(result.errors?.join('\n') || result.error || '編集データの操作に失敗しました。') as Error & { status?: number }
    error.status = response.status
    throw error
  }
  return result
}

export const editorApi = {
  snapshot: () => request('/snapshot'),
  createDrill: (body: unknown) => request('/drills', 'POST', body),
  updateDrill: (id: string, body: unknown) => request(`/drills/${encodeURIComponent(id)}`, 'PUT', body),
  deleteDrill: (id: string, body: unknown) => request(`/drills/${encodeURIComponent(id)}`, 'DELETE', body),
  createSource: (body: unknown) => request('/sources', 'POST', body),
  updateSource: (id: string, body: unknown) => request(`/sources/${encodeURIComponent(id)}`, 'PUT', body),
  deleteSource: (id: string, body: unknown) => request(`/sources/${encodeURIComponent(id)}`, 'DELETE', body),
}
