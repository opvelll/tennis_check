import type { Drill, MediaSource } from '../types/catalog'
import { sourceUsage } from './validation'

type Props = {
  source: MediaSource
  isNew: boolean
  drills: Drill[]
  onChange: (source: MediaSource) => void
}

export function SourceEditor({ source, isNew, drills, onChange }: Props) {
  const usage = source.id ? sourceUsage(source.id, drills) : []
  function patch<K extends keyof MediaSource>(key: K, value: MediaSource[K]) {
    onChange({ ...source, [key]: value })
  }
  return (
    <div className="source-master-editor">
      <small className="editor-id">{source.id || '新しい資料ID'}</small>
      <h1>{source.title || '新しい参考資料'}</h1>
      <div className="editor-tabs"><button className="active" type="button">資料情報</button></div>
      <div className="editor-form-section">
        <div className="editor-form-grid two">
          <label className="editor-field"><span>ID</span><input disabled={!isNew} onChange={(event) => patch('id', event.target.value)} placeholder="organization-topic" value={source.id} /></label>
          <label className="editor-field"><span>媒体種別</span><input onChange={(event) => patch('kind', event.target.value)} placeholder="article / video-page / pdf" value={source.kind} /></label>
        </div>
        <label className="editor-field"><span>タイトル</span><input onChange={(event) => patch('title', event.target.value)} value={source.title} /></label>
        <label className="editor-field"><span>提供組織</span><input onChange={(event) => patch('organization', event.target.value)} value={source.organization} /></label>
        <label className="editor-field"><span>URL</span><input onChange={(event) => patch('url', event.target.value)} type="url" value={source.url} /></label>
        <label className="editor-field"><span>参照メモ</span><textarea onChange={(event) => patch('note', event.target.value)} rows={5} value={source.note} /></label>
        <section className="source-usage"><h2>使用中の練習 <span>{usage.length}</span></h2>{usage.length ? <ul>{usage.map((item) => <li key={item.id}><code>{item.id}</code>{item.name}</li>)}</ul> : <p>この資料を使用している練習はありません。</p>}</section>
      </div>
    </div>
  )
}
