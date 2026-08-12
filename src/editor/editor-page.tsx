import { useEffect, useState } from 'react'
import { Brand } from '../components/brand'
import { CheckIcon, PlusIcon, SearchIcon } from '../components/icons'
import type { Drill, MediaSource } from '../types/catalog'
import { editorApi, type EditorSnapshot } from './api'
import { DrillEditor, type DrillEditorTab } from './drill-editor'
import { cleanDrill, clone, duplicateDrill, emptyDrill, emptySource } from './editor-helpers'
import { SourceEditor } from './source-editor'
import { validateDrill, validateSource } from './validation'
import './editor.css'

type Mode = 'drills' | 'sources'
type DraftState =
  | { type: 'drill'; value: Drill; original?: Drill; categoryId: string }
  | { type: 'source'; value: MediaSource; original?: MediaSource }

export default function EditorPage() {
  const [snapshot, setSnapshot] = useState<EditorSnapshot>()
  const [draft, setDraft] = useState<DraftState>()
  const [mode, setMode] = useState<Mode>('drills')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drillTab, setDrillTab] = useState<DrillEditorTab>('basic')
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()

  const dirty = draft ? JSON.stringify(draft.value) !== JSON.stringify(draft.original) : false
  const allDrills = snapshot?.categories.flatMap((category) => category.drills) ?? []
  const errors = snapshot && draft?.type === 'drill'
    ? validateDrill(cleanDrill(draft.value), { catalog: snapshot.catalog, drills: allDrills, sources: snapshot.sources.sources, originalId: draft.original?.id })
    : snapshot && draft?.type === 'source' ? validateSource(draft.value, snapshot.sources.sources, draft.original?.id) : []

  useEffect(() => {
    editorApi.snapshot().then((next) => {
      setSnapshot(next)
      const firstCategory = next.categories[0]
      if (firstCategory?.drills[0]) setDraft({ type: 'drill', value: clone(firstCategory.drills[0]), original: clone(firstCategory.drills[0]), categoryId: firstCategory.id })
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  function mayLeave() {
    return !dirty || window.confirm('未保存の変更を破棄しますか？')
  }

  function selectDrill(drill: Drill, categoryId: string) {
    if (!mayLeave()) return
    setDrillTab('basic')
    setDraft({ type: 'drill', value: clone(drill), original: clone(drill), categoryId })
    setError(undefined)
    setNotice(undefined)
  }

  function selectSource(source: MediaSource) {
    if (!mayLeave()) return
    setDraft({ type: 'source', value: clone(source), original: clone(source) })
    setError(undefined)
    setNotice(undefined)
  }

  function changeMode(nextMode: Mode) {
    if (nextMode === mode || !mayLeave()) return
    setMode(nextMode)
    setDrillTab('basic')
    setQuery('')
    setError(undefined)
    setNotice(undefined)
    if (nextMode === 'sources' && snapshot?.sources.sources[0]) {
      const source = snapshot.sources.sources[0]
      setDraft({ type: 'source', value: clone(source), original: clone(source) })
    }
    if (nextMode === 'drills' && snapshot?.categories[0]?.drills[0]) {
      const drill = snapshot.categories[0].drills[0]
      setDraft({ type: 'drill', value: clone(drill), original: clone(drill), categoryId: snapshot.categories[0].id })
    }
  }

  function createNew() {
    if (!snapshot || !mayLeave()) return
    setError(undefined)
    setNotice(undefined)
    if (mode === 'drills') {
      const category = categoryFilter === 'all' ? snapshot.categories[0] : snapshot.categories.find((item) => item.id === categoryFilter) ?? snapshot.categories[0]
      setDrillTab('basic')
      setDraft({ type: 'drill', value: emptyDrill([category.label, '未分類']), categoryId: category.id })
    } else setDraft({ type: 'source', value: emptySource() })
  }

  function duplicateCurrent() {
    if (!snapshot || draft?.type !== 'drill' || !draft.original || !mayLeave()) return
    setDrillTab('basic')
    setDraft({ type: 'drill', value: duplicateDrill(draft.value), categoryId: draft.categoryId })
    setError(undefined)
    setNotice('複製を作成しました。新しいIDを入力して保存してください。')
  }

  function applySnapshot(next: EditorSnapshot, selectedId: string, type: Mode) {
    setSnapshot(next)
    if (type === 'drills') {
      const category = next.categories.find((item) => item.drills.some((drill) => drill.id === selectedId))
      const drill = category?.drills.find((item) => item.id === selectedId)
      if (category && drill) setDraft({ type: 'drill', value: clone(drill), original: clone(drill), categoryId: category.id })
    } else {
      const source = next.sources.sources.find((item) => item.id === selectedId)
      if (source) setDraft({ type: 'source', value: clone(source), original: clone(source) })
    }
  }

  async function save() {
    if (!snapshot || !draft || errors.length || !dirty) return
    setSaving(true)
    setError(undefined)
    try {
      if (draft.type === 'drill') {
        const value = cleanDrill(draft.value)
        const category = draft.original
          ? snapshot.categories.find((item) => item.id === draft.categoryId)
          : snapshot.categories.find((item) => item.label === value.category[0])
        if (!category) throw new Error('保存先カテゴリが見つかりません。')
        const body = { categoryId: category.id, drill: value, expectedRevision: category.revision, expectedCatalogRevision: snapshot.catalogRevision }
        const next = draft.original ? await editorApi.updateDrill(draft.original.id, body) : await editorApi.createDrill(body)
        applySnapshot(next, value.id, 'drills')
      } else {
        const body = { source: draft.value, expectedRevision: snapshot.sourcesRevision, expectedCatalogRevision: snapshot.catalogRevision }
        const next = draft.original ? await editorApi.updateSource(draft.original.id, body) : await editorApi.createSource(body)
        applySnapshot(next, draft.value.id, 'sources')
      }
      setNotice('保存しました。')
    } catch (reason) {
      const issue = reason as Error & { status?: number }
      setError(issue.status === 409 ? `${issue.message}\n外部変更を失わないよう上書きを止めました。` : issue.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!snapshot || !draft?.original) return
    const label = draft.type === 'drill' ? draft.value.name : draft.value.title
    if (!window.confirm(`「${label}」を削除しますか？\nGitから復元できますが、この操作はファイルへ即時反映されます。`)) return
    setSaving(true)
    setError(undefined)
    try {
      let next: EditorSnapshot
      if (draft.type === 'drill') {
        const category = snapshot.categories.find((item) => item.id === draft.categoryId)!
        next = await editorApi.deleteDrill(draft.original.id, { categoryId: draft.categoryId, expectedRevision: category.revision, expectedCatalogRevision: snapshot.catalogRevision })
        setSnapshot(next)
        const first = next.categories.flatMap((item) => item.drills.map((drill) => ({ drill, categoryId: item.id })))[0]
        setDraft(first ? { type: 'drill', value: clone(first.drill), original: clone(first.drill), categoryId: first.categoryId } : undefined)
      } else {
        next = await editorApi.deleteSource(draft.original.id, { expectedRevision: snapshot.sourcesRevision, expectedCatalogRevision: snapshot.catalogRevision })
        setSnapshot(next)
        const first = next.sources.sources[0]
        setDraft(first ? { type: 'source', value: clone(first), original: clone(first) } : undefined)
      }
      setNotice('削除しました。')
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    if (!draft?.original) {
      if (snapshot) {
        if (mode === 'drills') {
          const first = snapshot.categories[0]?.drills[0]
          if (first) setDraft({ type: 'drill', value: clone(first), original: clone(first), categoryId: snapshot.categories[0].id })
        } else {
          const first = snapshot.sources.sources[0]
          if (first) setDraft({ type: 'source', value: clone(first), original: clone(first) })
        }
      }
      return
    }
    setDraft(draft.type === 'drill'
      ? { ...draft, value: clone(draft.original), original: clone(draft.original) }
      : { ...draft, value: clone(draft.original), original: clone(draft.original) })
    setError(undefined)
    setNotice(undefined)
  }

  if (loading) return <div className="editor-loading">練習データを読み込んでいます…</div>
  if (!snapshot) return <div className="editor-loading error">編集データを読み込めませんでした。<br />{error}</div>

  const normalizedQuery = query.trim().toLowerCase()
  const drillRows = snapshot.categories.flatMap((category) => category.drills.map((drill) => ({ drill, categoryId: category.id }))).filter(({ drill, categoryId }) => {
    const categoryMatch = categoryFilter === 'all' || categoryId === categoryFilter
    const queryMatch = !normalizedQuery || `${drill.id} ${drill.name} ${drill.summary}`.toLowerCase().includes(normalizedQuery)
    return categoryMatch && queryMatch
  })
  const sourceRows = snapshot.sources.sources.filter((source) => !normalizedQuery || `${source.id} ${source.title} ${source.organization}`.toLowerCase().includes(normalizedQuery))
  const outputCategory = draft?.type === 'drill'
    ? (draft.original ? snapshot.categories.find((item) => item.id === draft.categoryId) : snapshot.categories.find((item) => item.label === draft.value.category[0]))
    : undefined

  return (
    <div className="editor-app">
      <div className="editor-mobile-block"><Brand /><h1>練習データ編集</h1><p>正確なコート操作のため、幅900px以上の画面で開いてください。</p><a href="#/drills">練習一覧へ戻る</a></div>
      <header className="editor-header">
        <div className="editor-header-title"><a aria-label="練習一覧へ戻る" href="#/drills"><Brand /></a><span className="header-divider" /><h1>練習データ編集</h1><span className="local-indicator"><i />ローカル編集中</span></div>
        <div className="editor-header-actions"><button disabled={!dirty || saving} onClick={discard} type="button">変更を破棄</button><button className="save-button" disabled={!dirty || saving || errors.length > 0} onClick={save} type="button">{saving ? '保存中…' : '保存'}</button>{dirty ? <i aria-label="未保存の変更あり" className="unsaved-dot" /> : null}</div>
      </header>
      <div className={`editor-shell ${draft?.type === 'drill' && drillTab === 'court' ? 'court-mode' : ''}`}>
        <aside className="editor-rail">
          <div className="editor-mode-switch"><button className={mode === 'drills' ? 'active' : ''} onClick={() => changeMode('drills')} type="button">練習</button><button className={mode === 'sources' ? 'active' : ''} onClick={() => changeMode('sources')} type="button">参考資料</button></div>
          <label className="editor-search"><SearchIcon size={18} /><input onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'drills' ? '練習名・IDを検索' : '資料名・IDを検索'} value={query} /></label>
          {mode === 'drills' ? <div className="editor-categories"><h2>カテゴリ</h2><button className={categoryFilter === 'all' ? 'active' : ''} onClick={() => setCategoryFilter('all')} type="button"><span>すべて</span><small>{snapshot.catalog.totalDrills}</small></button>{snapshot.categories.map((category) => <button className={categoryFilter === category.id ? 'active' : ''} key={category.id} onClick={() => setCategoryFilter(category.id)} type="button"><span>{category.label}</span><small>{category.drills.length}</small></button>)}</div> : null}
          <div className="editor-list-heading"><h2>{mode === 'drills' ? '練習一覧' : '参考資料一覧'}</h2><span>{mode === 'drills' ? drillRows.length : sourceRows.length}件</span></div>
          <div className="editor-record-list">
            {mode === 'drills' ? drillRows.map(({ drill, categoryId }) => <button className={draft?.type === 'drill' && draft.original?.id === drill.id ? 'active' : ''} key={drill.id} onClick={() => selectDrill(drill, categoryId)} type="button"><small>{drill.id}</small><strong>{drill.name}</strong>{draft?.type === 'drill' && draft.original?.id === drill.id && dirty ? <i /> : null}</button>) : sourceRows.map((source) => <button className={draft?.type === 'source' && draft.original?.id === source.id ? 'active' : ''} key={source.id} onClick={() => selectSource(source)} type="button"><small>{source.id}</small><strong>{source.title}</strong>{draft?.type === 'source' && draft.original?.id === source.id && dirty ? <i /> : null}</button>)}
          </div>
          <button className="editor-new-button" onClick={createNew} type="button"><PlusIcon size={17} />{mode === 'drills' ? '新しい練習' : '新しい参考資料'}</button>
        </aside>
        <main className="editor-workspace">
          {notice ? <div className="editor-notice"><CheckIcon size={17} />{notice}</div> : null}
          {error ? <div className="editor-error" role="alert">{error}</div> : null}
          {draft?.type === 'drill' ? <DrillEditor categories={snapshot.catalog.files} drill={draft.value} isNew={!draft.original} key={draft.original?.id ?? 'new-drill'} onChange={(value) => setDraft({ ...draft, value })} onTabChange={setDrillTab} sources={snapshot.sources.sources} /> : null}
          {draft?.type === 'source' ? <SourceEditor drills={allDrills} isNew={!draft.original} onChange={(value) => setDraft({ ...draft, value })} source={draft.value} /> : null}
        </main>
        <aside className="editor-status-rail">
          <section><h2>検証</h2>{errors.length ? <div className="validation-errors"><strong>修正が必要です</strong><ul>{errors.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="validation-ok"><CheckIcon size={19} /><span><strong>保存できます</strong><small>データの検証に問題はありません。</small></span></div>}</section>
          <section><h2>出力先</h2><code>{draft?.type === 'source' ? 'data/sources.json' : outputCategory ? `data/${outputCategory.path}` : 'data/drills/*.json'}</code></section>
          {draft?.type === 'drill' && draft.original ? <section className="status-actions"><h2>項目操作</h2><button onClick={duplicateCurrent} type="button">練習を複製</button><button className="delete-button" onClick={remove} type="button">練習を削除</button></section> : null}
          {draft?.type === 'source' && draft.original ? <section className="status-actions"><h2>資料操作</h2><button className="delete-button" onClick={remove} type="button">参考資料を削除</button></section> : null}
        </aside>
      </div>
    </div>
  )
}
