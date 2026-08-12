import { useState } from 'react'
import { PlusIcon } from '../components/icons'
import type { CategoryMeta, CourtDiagram, Drill, MediaSource } from '../types/catalog'
import { ArrayField } from './array-field'
import { CourtEditor } from './court-editor'
import { clone, emptyPhase } from './editor-helpers'

export type DrillEditorTab = 'basic' | 'content' | 'court' | 'references'

type Props = {
  drill: Drill
  isNew: boolean
  categories: CategoryMeta[]
  sources: MediaSource[]
  onChange: (drill: Drill) => void
  onTabChange?: (tab: DrillEditorTab) => void
}

const tabs: Array<{ id: DrillEditorTab; label: string }> = [
  { id: 'basic', label: '基本情報' },
  { id: 'content', label: '実施内容' },
  { id: 'court', label: 'コート配置' },
  { id: 'references', label: '参照' },
]

function CsvField({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder?: string }) {
  return <label className="editor-field"><span>{label}</span><input onChange={(event) => onChange(event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} placeholder={placeholder} value={values.join(', ')} /></label>
}

export function DrillEditor({ drill, isNew, categories, sources, onChange, onTabChange }: Props) {
  const [tab, setTab] = useState<DrillEditorTab>('basic')
  const [phaseIndex, setPhaseIndex] = useState(0)

  function patch<K extends keyof Drill>(key: K, value: Drill[K]) {
    onChange({ ...drill, [key]: value })
  }

  function ensureDiagram() {
    const diagram: CourtDiagram = drill.diagram ?? { orientation: 'vertical', phases: [emptyPhase()] }
    patch('diagram', diagram)
  }

  function updatePhase(index: number, phase: CourtDiagram['phases'][number]) {
    if (!drill.diagram) return
    const diagram = clone(drill.diagram)
    diagram.phases[index] = phase
    patch('diagram', diagram)
  }

  function addPhase(copyCurrent = false) {
    const diagram = clone(drill.diagram ?? { orientation: 'vertical' as const, phases: [] })
    const phase = copyCurrent && diagram.phases[phaseIndex] ? clone(diagram.phases[phaseIndex]) : emptyPhase(`フェーズ ${diagram.phases.length + 1}`)
    if (copyCurrent) phase.label = `${phase.label}（コピー）`
    diagram.phases.push(phase)
    patch('diagram', diagram)
    setPhaseIndex(diagram.phases.length - 1)
  }

  function deletePhase() {
    if (!drill.diagram) return
    const diagram = clone(drill.diagram)
    diagram.phases.splice(phaseIndex, 1)
    if (!diagram.phases.length) patch('diagram', undefined)
    else patch('diagram', diagram)
    setPhaseIndex(Math.max(0, phaseIndex - 1))
  }

  function movePhase(direction: -1 | 1) {
    if (!drill.diagram) return
    const target = phaseIndex + direction
    if (target < 0 || target >= drill.diagram.phases.length) return
    const diagram = clone(drill.diagram)
    ;[diagram.phases[phaseIndex], diagram.phases[target]] = [diagram.phases[target], diagram.phases[phaseIndex]]
    patch('diagram', diagram)
    setPhaseIndex(target)
  }

  return (
    <div className="drill-editor">
      <div className="editor-breadcrumb">{drill.category.filter(Boolean).join('　/　')}</div>
      <small className="editor-id">{drill.id || '新しいID'}</small>
      <h1>{drill.name || '新しい練習'}</h1>
      <div aria-label="練習編集セクション" className="editor-tabs" role="tablist">
        {tabs.map((item) => <button aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => { setTab(item.id); onTabChange?.(item.id) }} role="tab" type="button">{item.label}</button>)}
      </div>

      {tab === 'basic' ? (
        <div className="editor-form-section">
          <div className="editor-form-grid two">
            <label className="editor-field"><span>ID</span><input disabled={!isNew} onChange={(event) => patch('id', event.target.value)} placeholder="tech-fh-01" value={drill.id} /></label>
            <label className="editor-field"><span>ステータス</span><select onChange={(event) => patch('status', event.target.value as Drill['status'])} value={drill.status}><option value="draft">下書き</option><option value="derived">構成済み</option><option value="researched">資料対応</option></select></label>
          </div>
          <label className="editor-field"><span>練習名</span><input onChange={(event) => patch('name', event.target.value)} value={drill.name} /></label>
          <label className="editor-field"><span>概要</span><textarea onChange={(event) => patch('summary', event.target.value)} rows={3} value={drill.summary} /></label>
          <div className="editor-form-grid three">
            <label className="editor-field"><span>大分類</span><select disabled={!isNew} onChange={(event) => patch('category', [event.target.value, drill.category[1] || '未分類', drill.category[2]])} value={drill.category[0]}>{categories.map((category) => <option key={category.id} value={category.label}>{category.label}</option>)}</select></label>
            <label className="editor-field"><span>中分類</span><input onChange={(event) => patch('category', [drill.category[0], event.target.value, drill.category[2]])} value={drill.category[1]} /></label>
            <label className="editor-field"><span>小分類</span><input onChange={(event) => patch('category', [drill.category[0], drill.category[1], event.target.value || undefined])} value={drill.category[2] ?? ''} /></label>
          </div>
          <CsvField label="別名" onChange={(values) => patch('aliases', values)} placeholder="カンマ区切り" values={drill.aliases ?? []} />
          <ArrayField label="目的" multiline onChange={(values) => patch('purposes', values)} values={drill.purposes ?? []} />
          <div className="editor-form-grid three">
            <label className="editor-field"><span>強度</span><select onChange={(event) => patch('intensity', event.target.value as Drill['intensity'])} value={drill.intensity}><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label>
            <label className="editor-field"><span>最短時間（分）</span><input min="1" onChange={(event) => patch('durationMinutes', { ...drill.durationMinutes, min: Number(event.target.value) })} type="number" value={drill.durationMinutes.min} /></label>
            <label className="editor-field"><span>最長時間（分）</span><input min="1" onChange={(event) => patch('durationMinutes', { ...drill.durationMinutes, max: Number(event.target.value) })} type="number" value={drill.durationMinutes.max} /></label>
          </div>
          <div className="editor-form-grid two">
            <label className="editor-field"><span>最小人数</span><input min="1" onChange={(event) => patch('playerCount', { ...drill.playerCount, min: Number(event.target.value) })} type="number" value={drill.playerCount.min} /></label>
            <label className="editor-field"><span>最大人数</span><input min="1" onChange={(event) => patch('playerCount', { ...drill.playerCount, max: event.target.value ? Number(event.target.value) : undefined })} placeholder="上限なし" type="number" value={drill.playerCount.max ?? ''} /></label>
          </div>
          <fieldset className="editor-check-group"><legend>種目</legend>{(['singles', 'doubles', 'both'] as const).map((value) => <label key={value}><input checked={drill.disciplines.includes(value)} onChange={(event) => patch('disciplines', event.target.checked ? [...drill.disciplines, value] : drill.disciplines.filter((item) => item !== value))} type="checkbox" />{value === 'singles' ? 'シングルス' : value === 'doubles' ? 'ダブルス' : '共通'}</label>)}</fieldset>
          <CsvField label="形式" onChange={(values) => patch('formats', values)} values={drill.formats} />
          <CsvField label="環境" onChange={(values) => patch('environments', values)} values={drill.environments} />
          <CsvField label="用具" onChange={(values) => patch('equipment', values)} values={drill.equipment} />
          <CsvField label="タグ" onChange={(values) => patch('tags', values)} values={drill.tags} />
        </div>
      ) : null}

      {tab === 'content' ? (
        <div className="editor-form-section">
          <ArrayField label="セットアップ" multiline onChange={(values) => patch('setup', values)} values={drill.setup ?? []} />
          <ArrayField label="手順" multiline onChange={(values) => patch('steps', values)} values={drill.steps ?? []} />
          <ArrayField label="チェックポイント" multiline onChange={(values) => patch('cues', values)} values={drill.cues} />
          <ArrayField label="成功条件" multiline onChange={(values) => patch('successCriteria', values)} values={drill.successCriteria ?? []} />
          <ArrayField label="よくある失敗" multiline onChange={(values) => patch('commonErrors', values)} values={drill.commonErrors ?? []} />
          <ArrayField label="注意点" multiline onChange={(values) => patch('safetyNotes', values)} values={drill.safetyNotes ?? []} />
          <ArrayField label="難しくする" multiline onChange={(values) => patch('progressions', values)} values={drill.progressions ?? []} />
          <ArrayField label="簡単にする" multiline onChange={(values) => patch('regressions', values)} values={drill.regressions ?? []} />
        </div>
      ) : null}

      {tab === 'court' ? (
        <div className="editor-form-section court-tab-content">
          {!drill.diagram ? <div className="editor-empty-court"><p>この練習にはコート配置がありません。</p><button className="editor-primary" onClick={ensureDiagram} type="button"><PlusIcon size={17} />コート配置を追加</button></div> : <>
            <div className="phase-toolbar">
              <div className="phase-buttons">{drill.diagram.phases.map((phase, index) => <button className={phaseIndex === index ? 'active' : ''} key={`${phase.label}-${index}`} onClick={() => setPhaseIndex(index)} type="button"><span>{index + 1}</span>{phase.label}</button>)}</div>
              <button onClick={() => addPhase(false)} type="button"><PlusIcon size={15} />フェーズ</button>
            </div>
            <CourtEditor key={phaseIndex} onChange={(phase) => updatePhase(phaseIndex, phase)} phase={drill.diagram.phases[phaseIndex] ?? drill.diagram.phases[0]} />
            <div className="phase-row-actions"><button disabled={phaseIndex === 0} onClick={() => movePhase(-1)} type="button">← 前へ</button><button disabled={phaseIndex === drill.diagram.phases.length - 1} onClick={() => movePhase(1)} type="button">後ろへ →</button><button onClick={() => addPhase(true)} type="button">フェーズを複製</button><button className="danger-text" onClick={deletePhase} type="button">フェーズを削除</button></div>
          </>}
        </div>
      ) : null}

      {tab === 'references' ? (
        <div className="editor-form-section">
          <div className="source-picker-heading"><div><h2>参考資料</h2><p>表示用のmediaと、内容参照用のsourcesを別々に指定できます。</p></div></div>
          <div className="source-picker-list">{sources.map((source) => <div className="source-picker-row" key={source.id}><span><strong>{source.title}</strong><small>{source.id}・{source.organization}</small></span><label><input checked={drill.media.includes(source.id)} onChange={(event) => patch('media', event.target.checked ? [...drill.media, source.id] : drill.media.filter((id) => id !== source.id))} type="checkbox" />表示</label><label><input checked={drill.sources.includes(source.id)} onChange={(event) => patch('sources', event.target.checked ? [...drill.sources, source.id] : drill.sources.filter((id) => id !== source.id))} type="checkbox" />参照</label></div>)}</div>
          <div className="image-fields"><h2>補助画像</h2><label className="editor-field"><span>画像パス</span><input onChange={(event) => patch('image', { src: event.target.value, alt: drill.image?.alt ?? '', credit: drill.image?.credit })} value={drill.image?.src ?? ''} /></label><label className="editor-field"><span>代替テキスト</span><input onChange={(event) => patch('image', { src: drill.image?.src ?? '', alt: event.target.value, credit: drill.image?.credit })} value={drill.image?.alt ?? ''} /></label><label className="editor-field"><span>クレジット</span><input onChange={(event) => patch('image', { src: drill.image?.src ?? '', alt: drill.image?.alt ?? '', credit: event.target.value })} value={drill.image?.credit ?? ''} /></label></div>
        </div>
      ) : null}
    </div>
  )
}
