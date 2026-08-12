import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { CourtCanvas, type CourtSelection } from '../components/court-diagram'
import { CheckIcon, PlusIcon } from '../components/icons'
import type { CourtActorRole, CourtPhase, CourtPoint, CourtTarget } from '../types/catalog'
import { clampCoordinate, clone, nextActorId } from './editor-helpers'

type Tool = 'select' | CourtActorRole | 'equipment' | 'ball' | 'movement' | 'rect' | 'ellipse' | 'polygon'
type Draft = { tool: 'ball' | 'movement' | 'polygon'; points: CourtPoint[] } | { tool: 'rect' | 'ellipse'; points: CourtPoint[] }

type Props = {
  phase: CourtPhase
  onChange: (phase: CourtPhase) => void
}

const tools: Array<{ id: Tool; label: string }> = [
  { id: 'player', label: '選手' },
  { id: 'opponent', label: '相手' },
  { id: 'feeder', label: '球出し' },
  { id: 'equipment', label: '用具' },
  { id: 'rect', label: '矩形の狙い' },
  { id: 'ellipse', label: '楕円の狙い' },
  { id: 'polygon', label: '多角形の狙い' },
  { id: 'ball', label: '球道' },
  { id: 'movement', label: '移動' },
  { id: 'select', label: '選択' },
]

function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === 'player' || tool === 'opponent' || tool === 'feeder') return <svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6" r="3" /><path d="M4.5 17c.6-4 2.5-6 5.5-6s4.9 2 5.5 6" /></svg>
  if (tool === 'equipment') return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 8h12l-1 8H5L4 8Zm3-4h6l2 4H5l2-4Z" /></svg>
  if (tool === 'rect') return <svg aria-hidden="true" viewBox="0 0 20 20"><rect height="10" rx="1" width="12" x="4" y="5" /></svg>
  if (tool === 'ellipse') return <svg aria-hidden="true" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="6" ry="4.5" /></svg>
  if (tool === 'polygon') return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m10 3 7 6-3 8H6L3 9l7-6Z" /></svg>
  if (tool === 'ball' || tool === 'movement') return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 14c4-8 8-1 13-8m-3 0h3v3" strokeDasharray={tool === 'movement' ? '2 2' : undefined} /></svg>
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 3 10 8-5 1-2 5-3-14Z" /></svg>
}

function selectionLabel(selection: CourtSelection, phase: CourtPhase) {
  if (selection.kind === 'actor') return `人物 ${phase.actors[selection.index]?.label ?? selection.index + 1}`
  if (selection.kind === 'equipment') return `用具 ${selection.index + 1}`
  if (selection.kind === 'target') return `狙い ${selection.index + 1}`
  return `${phase.paths[selection.index]?.type === 'ball' ? '球道' : '移動'} ${selection.index + 1}`
}

function pointerPoint(event: ReactPointerEvent<SVGSVGElement>): CourtPoint {
  const rect = event.currentTarget.getBoundingClientRect()
  return [
    clampCoordinate(((event.clientX - rect.left) / rect.width) * 100),
    clampCoordinate(((event.clientY - rect.top) / rect.height) * 100),
  ]
}

function previewPhase(phase: CourtPhase, draft?: Draft): CourtPhase {
  if (!draft?.points.length) return phase
  if (draft.tool === 'ball' || draft.tool === 'movement') {
    return { ...phase, paths: [...phase.paths, { type: draft.tool, points: draft.points, showArrow: true }] }
  }
  return { ...phase, targets: [...phase.targets, { shape: draft.tool, points: draft.points }] }
}

export function CourtEditor({ phase, onChange }: Props) {
  const [tool, setTool] = useState<Tool>('select')
  const [selected, setSelected] = useState<CourtSelection>()
  const [draft, setDraft] = useState<Draft>()
  const [dragging, setDragging] = useState<CourtSelection>()
  const [history, setHistory] = useState<CourtPhase[]>([])
  const dragOrigin = useRef<CourtPhase | undefined>(undefined)

  function commit(next: CourtPhase) {
    setHistory((current) => [...current.slice(-49), clone(phase)])
    onChange(next)
  }

  function undo() {
    const previous = history.at(-1)
    if (!previous) return
    setHistory((current) => current.slice(0, -1))
    onChange(previous)
    setSelected(undefined)
  }

  function finishDraft() {
    if (!draft) return
    if ((draft.tool === 'ball' || draft.tool === 'movement') && draft.points.length >= 2) {
      const index = phase.paths.length
      commit({ ...phase, paths: [...phase.paths, { type: draft.tool, points: draft.points, order: phase.paths.length + 1, showArrow: true }] })
      setSelected({ kind: 'path', index })
    } else if (draft.tool === 'polygon' && draft.points.length >= 3) {
      const index = phase.targets.length
      commit({ ...phase, targets: [...phase.targets, { shape: 'polygon', points: draft.points }] })
      setSelected({ kind: 'target', index })
    }
    setDraft(undefined)
    setTool('select')
  }

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const editingText = target?.matches('input, textarea, select')
      if (event.key === 'Escape' && draft) {
        event.preventDefault()
        setDraft(undefined)
      } else if (event.key === 'Enter' && draft && !editingText) {
        event.preventDefault()
        finishDraft()
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !editingText) {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  })

  function updateSelected(point: CourtPoint) {
    if (!dragging) return
    const next = clone(phase)
    if (dragging.kind === 'actor') {
      next.actors[dragging.index].x = point[0]
      next.actors[dragging.index].y = point[1]
    } else if (dragging.kind === 'equipment') {
      next.equipment[dragging.index].x = point[0]
      next.equipment[dragging.index].y = point[1]
    } else if (dragging.kind === 'path' && dragging.pointIndex !== undefined) {
      next.paths[dragging.index].points[dragging.pointIndex] = point
    } else if (dragging.kind === 'target' && dragging.pointIndex !== undefined) {
      next.targets[dragging.index].points[dragging.pointIndex] = point
    }
    onChange(next)
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    const point = pointerPoint(event)
    const element = (event.target as SVGElement).closest<SVGElement>('[data-kind]')
    if (tool === 'select' && element) {
      const selection = {
        kind: element.dataset.kind as CourtSelection['kind'],
        index: Number(element.dataset.index),
        pointIndex: element.dataset.pointIndex === undefined ? undefined : Number(element.dataset.pointIndex),
      }
      setSelected(selection)
      setDragging(selection)
      dragOrigin.current = clone(phase)
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    if (tool === 'select') {
      setSelected(undefined)
      return
    }
    if (tool === 'player' || tool === 'opponent' || tool === 'feeder') {
      const index = phase.actors.length
      const id = nextActorId(phase, tool)
      commit({ ...phase, actors: [...phase.actors, { id, role: tool, label: id.toUpperCase(), x: point[0], y: point[1] }] })
      setSelected({ kind: 'actor', index })
      setTool('select')
      return
    }
    if (tool === 'equipment') {
      const index = phase.equipment.length
      commit({ ...phase, equipment: [...phase.equipment, { type: 'cone', x: point[0], y: point[1] }] })
      setSelected({ kind: 'equipment', index })
      setTool('select')
      return
    }
    if (tool === 'rect' || tool === 'ellipse') {
      setDraft({ tool, points: [point, point] })
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    if (tool === 'ball' || tool === 'movement' || tool === 'polygon') {
      setDraft((current) => current?.tool === tool ? { ...current, points: [...current.points, point] } : { tool, points: [point] })
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const point = pointerPoint(event)
    if (dragging) updateSelected(point)
    else if (draft && (draft.tool === 'rect' || draft.tool === 'ellipse')) setDraft({ ...draft, points: [draft.points[0], point] })
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>) {
    if (dragging && dragOrigin.current) {
      setHistory((current) => [...current.slice(-49), dragOrigin.current!])
      dragOrigin.current = undefined
      setDragging(undefined)
      event.currentTarget.releasePointerCapture(event.pointerId)
      return
    }
    if (draft && (draft.tool === 'rect' || draft.tool === 'ellipse')) {
      const [start, end] = draft.points
      if (Math.abs(end[0] - start[0]) >= 1 && Math.abs(end[1] - start[1]) >= 1) {
        const index = phase.targets.length
        commit({ ...phase, targets: [...phase.targets, { shape: draft.tool, points: draft.points }] })
        setSelected({ kind: 'target', index })
      }
      setDraft(undefined)
      setTool('select')
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function updateActor(index: number, patch: Partial<CourtPhase['actors'][number]>) {
    const next = clone(phase)
    Object.assign(next.actors[index], patch)
    commit(next)
  }

  function updateEquipment(index: number, patch: Partial<CourtPhase['equipment'][number]>) {
    const next = clone(phase)
    Object.assign(next.equipment[index], patch)
    commit(next)
  }

  function updatePath(index: number, patch: Partial<CourtPhase['paths'][number]>) {
    const next = clone(phase)
    Object.assign(next.paths[index], patch)
    commit(next)
  }

  function updateTarget(index: number, patch: Partial<CourtTarget>) {
    const next = clone(phase)
    Object.assign(next.targets[index], patch)
    commit(next)
  }

  function movePoint(points: CourtPoint[], pointIndex: number, direction: -1 | 1) {
    const target = pointIndex + direction
    if (target < 0 || target >= points.length) return points
    const next = clone(points)
    ;[next[pointIndex], next[target]] = [next[target], next[pointIndex]]
    return next
  }

  function removeSelected() {
    if (!selected) return
    const next = clone(phase)
    if (selected.kind === 'actor') next.actors.splice(selected.index, 1)
    if (selected.kind === 'equipment') next.equipment.splice(selected.index, 1)
    if (selected.kind === 'path') next.paths.splice(selected.index, 1)
    if (selected.kind === 'target') next.targets.splice(selected.index, 1)
    commit(next)
    setSelected(undefined)
  }

  const shownPhase = previewPhase(phase, draft)
  const instruction = draft
    ? `${draft.points.length}点を追加済み／Enterで確定／Escで取消`
    : tool === 'ball' || tool === 'movement' || tool === 'polygon'
      ? 'コート上をクリックして点を追加／Enterで確定／Escで取消'
      : tool === 'rect' || tool === 'ellipse' ? 'コート上をドラッグして範囲を作成' : '要素を選択、またはツールから追加'

  return (
    <div className="court-editor-layout">
      <div className="court-editor-main">
        <div aria-label="コート図ツール" className="court-toolbar">
          {tools.map((item) => <button aria-pressed={tool === item.id} className={tool === item.id ? 'active' : ''} key={item.id} onClick={() => { setTool(item.id); setDraft(undefined) }} type="button"><ToolIcon tool={item.id} />{item.label}</button>)}
          <button className="undo-button" disabled={!history.length} onClick={undo} type="button">↶ 元に戻す</button>
        </div>
        <p className="court-instruction">{instruction}</p>
        <CourtCanvas
          className="editor-court-canvas"
          interactive
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          phase={shownPhase}
          selected={selected}
        />
        <div className="phase-copy-fields">
          <label><span>フェーズ名</span><input onChange={(event) => onChange({ ...phase, label: event.target.value })} value={phase.label} /></label>
          <label><span>フェーズ説明</span><textarea onChange={(event) => onChange({ ...phase, description: event.target.value })} rows={3} value={phase.description ?? ''} /></label>
        </div>
      </div>
      <aside className="court-inspector">
        <h3>{selected ? `選択中: ${selectionLabel(selected, phase)}` : 'プロパティ'}</h3>
        {!selected ? <p className="inspector-empty">コート上の要素を選択すると、座標やラベルを調整できます。</p> : null}
        {selected?.kind === 'actor' && phase.actors[selected.index] ? (() => {
          const actor = phase.actors[selected.index]
          return <>
            <label><span>役割</span><select onChange={(event) => updateActor(selected.index, { role: event.target.value as CourtActorRole })} value={actor.role}><option value="player">選手</option><option value="opponent">相手</option><option value="feeder">球出し</option></select></label>
            <label><span>ラベル</span><input onChange={(event) => updateActor(selected.index, { label: event.target.value })} value={actor.label ?? ''} /></label>
            <CoordinateFields onChange={(x, y) => updateActor(selected.index, { x, y })} x={actor.x} y={actor.y} />
          </>
        })() : null}
        {selected?.kind === 'equipment' && phase.equipment[selected.index] ? (() => {
          const item = phase.equipment[selected.index]
          return <>
            <label><span>種類</span><input onChange={(event) => updateEquipment(selected.index, { type: event.target.value })} value={item.type} /></label>
            <label><span>ラベル</span><input onChange={(event) => updateEquipment(selected.index, { label: event.target.value })} value={item.label ?? ''} /></label>
            <CoordinateFields onChange={(x, y) => updateEquipment(selected.index, { x, y })} x={item.x} y={item.y} />
          </>
        })() : null}
        {selected?.kind === 'path' && phase.paths[selected.index] ? (() => {
          const path = phase.paths[selected.index]
          return <>
            <label><span>種類</span><select onChange={(event) => updatePath(selected.index, { type: event.target.value as 'ball' | 'movement' })} value={path.type}><option value="ball">ボール</option><option value="movement">移動</option></select></label>
            <label><span>順序</span><input min="1" onChange={(event) => updatePath(selected.index, { order: Number(event.target.value) || undefined })} type="number" value={path.order ?? ''} /></label>
            <label className="inline-check"><input checked={path.showArrow !== false} onChange={(event) => updatePath(selected.index, { showArrow: event.target.checked })} type="checkbox" />矢印を表示</label>
            <div className="point-list"><strong>点のリスト</strong>{path.points.map(([x, y], pointIndex) => <div key={pointIndex}><span>{pointIndex + 1}</span><input aria-label={`点${pointIndex + 1} X`} onChange={(event) => { const points = clone(path.points); points[pointIndex] = [clampCoordinate(Number(event.target.value)), y]; updatePath(selected.index, { points }) }} type="number" value={x} /><input aria-label={`点${pointIndex + 1} Y`} onChange={(event) => { const points = clone(path.points); points[pointIndex] = [x, clampCoordinate(Number(event.target.value))]; updatePath(selected.index, { points }) }} type="number" value={y} /><span className="point-actions"><button aria-label={`点${pointIndex + 1}を前へ`} disabled={pointIndex === 0} onClick={() => updatePath(selected.index, { points: movePoint(path.points, pointIndex, -1) })} type="button">↑</button><button aria-label={`点${pointIndex + 1}を後ろへ`} disabled={pointIndex === path.points.length - 1} onClick={() => updatePath(selected.index, { points: movePoint(path.points, pointIndex, 1) })} type="button">↓</button><button aria-label={`点${pointIndex + 1}を削除`} disabled={path.points.length <= 2} onClick={() => updatePath(selected.index, { points: path.points.filter((_, index) => index !== pointIndex) })} type="button">×</button></span></div>)}</div>
            <button className="inspector-add" onClick={() => updatePath(selected.index, { points: [...path.points, [50, 50]] })} type="button"><PlusIcon size={15} />点を追加</button>
          </>
        })() : null}
        {selected?.kind === 'target' && phase.targets[selected.index] ? (() => {
          const target = phase.targets[selected.index]
          return <>
            <label><span>形状</span><select onChange={(event) => updateTarget(selected.index, { shape: event.target.value as CourtTarget['shape'] })} value={target.shape}><option value="rect">矩形</option><option value="ellipse">楕円</option><option value="polygon">多角形</option></select></label>
            <label><span>ラベル</span><input onChange={(event) => updateTarget(selected.index, { label: event.target.value })} value={target.label ?? ''} /></label>
            <div className="point-list"><strong>点のリスト</strong>{target.points.map(([x, y], pointIndex) => <div key={pointIndex}><span>{pointIndex + 1}</span><input aria-label={`点${pointIndex + 1} X`} onChange={(event) => { const points = clone(target.points); points[pointIndex] = [clampCoordinate(Number(event.target.value)), y]; updateTarget(selected.index, { points }) }} type="number" value={x} /><input aria-label={`点${pointIndex + 1} Y`} onChange={(event) => { const points = clone(target.points); points[pointIndex] = [x, clampCoordinate(Number(event.target.value))]; updateTarget(selected.index, { points }) }} type="number" value={y} /><span className="point-actions"><button aria-label={`点${pointIndex + 1}を前へ`} disabled={pointIndex === 0} onClick={() => updateTarget(selected.index, { points: movePoint(target.points, pointIndex, -1) })} type="button">↑</button><button aria-label={`点${pointIndex + 1}を後ろへ`} disabled={pointIndex === target.points.length - 1} onClick={() => updateTarget(selected.index, { points: movePoint(target.points, pointIndex, 1) })} type="button">↓</button><button aria-label={`点${pointIndex + 1}を削除`} disabled={target.points.length <= (target.shape === 'polygon' ? 3 : 2)} onClick={() => updateTarget(selected.index, { points: target.points.filter((_, index) => index !== pointIndex) })} type="button">×</button></span></div>)}</div>
            {target.shape === 'polygon' ? <button className="inspector-add" onClick={() => updateTarget(selected.index, { points: [...target.points, [50, 50]] })} type="button"><PlusIcon size={15} />点を追加</button> : null}
          </>
        })() : null}
        {selected ? <button className="inspector-delete" onClick={removeSelected} type="button">選択要素を削除</button> : null}
        <div className="court-editor-legend"><h4>凡例</h4><span><i className="player" />選手</span><span><i className="opponent" />相手・球出し</span><span><i className="ball-path" />球道</span><span><i className="movement-path" />移動</span><span><i className="target" />狙い</span></div>
        <div className="validation-ok"><CheckIcon size={18} /><span><strong>コート図を編集中</strong><small>保存時に座標と図形を検証します。</small></span></div>
      </aside>
    </div>
  )
}

function CoordinateFields({ x, y, onChange }: { x: number; y: number; onChange: (x: number, y: number) => void }) {
  return (
    <div className="coordinate-grid">
      <label><span>X</span><input max="100" min="0" onChange={(event) => onChange(clampCoordinate(Number(event.target.value)), y)} type="number" value={x} /></label>
      <label><span>Y</span><input max="100" min="0" onChange={(event) => onChange(x, clampCoordinate(Number(event.target.value)))} type="number" value={y} /></label>
    </div>
  )
}
