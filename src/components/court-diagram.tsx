import { useId, useState, type PointerEventHandler } from 'react'
import type { CourtDiagram as CourtDiagramData, CourtPhase, CourtPoint, CourtTarget } from '../types/catalog'

const COURT_ASPECT_RATIO = 23.77 / 10.97
const COURT_VIEW_HEIGHT = Number((100 * COURT_ASPECT_RATIO).toFixed(2))
const BASELINE_TOP = 7
const BASELINE_BOTTOM = 93
const DOUBLES_LEFT = 7
const DOUBLES_RIGHT = 93
const SINGLES_INSET = ((10.97 - 8.23) / 2 / 10.97) * (DOUBLES_RIGHT - DOUBLES_LEFT)
const SINGLES_LEFT = DOUBLES_LEFT + SINGLES_INSET
const SINGLES_RIGHT = DOUBLES_RIGHT - SINGLES_INSET
const SERVICE_LINE_OFFSET = ((6.4 / 11.885) * (BASELINE_BOTTOM - BASELINE_TOP)) / 2
const SERVICE_LINE_TOP = 50 - SERVICE_LINE_OFFSET
const SERVICE_LINE_BOTTOM = 50 + SERVICE_LINE_OFFSET

function viewY(y: number) {
  return y * COURT_ASPECT_RATIO
}

function viewPoint([x, y]: CourtPoint): CourtPoint {
  return [x, viewY(y)]
}

export type CourtSelection = {
  kind: 'actor' | 'equipment' | 'path' | 'target'
  index: number
  pointIndex?: number
}

type CanvasProps = {
  phase: CourtPhase
  className?: string
  interactive?: boolean
  selected?: CourtSelection
  onPointerDown?: PointerEventHandler<SVGSVGElement>
  onPointerMove?: PointerEventHandler<SVGSVGElement>
  onPointerUp?: PointerEventHandler<SVGSVGElement>
}

function targetCenter(target: CourtTarget): CourtPoint | undefined {
  if (!target.points.length) return undefined
  if (target.shape !== 'polygon' && target.points.length >= 2) {
    const [start, end] = target.points
    return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
  }
  const [sumX, sumY] = target.points.reduce(
    ([x, y], point) => [x + point[0], y + point[1]],
    [0, 0],
  )
  return [sumX / target.points.length, sumY / target.points.length]
}

function TargetShape({ target, index, selected }: { target: CourtTarget; index: number; selected: boolean }) {
  const common = {
    'data-index': index,
    'data-kind': 'target',
    fill: 'rgba(250, 204, 21, .42)',
    stroke: selected ? '#0f172a' : '#facc15',
    strokeWidth: selected ? 1.3 : 0.8,
  }

  if (target.shape === 'rect' && target.points.length >= 2) {
    const [start, end] = target.points
    return (
      <rect
        {...common}
        height={viewY(Math.abs(end[1] - start[1]))}
        width={Math.abs(end[0] - start[0])}
        x={Math.min(start[0], end[0])}
        y={viewY(Math.min(start[1], end[1]))}
      />
    )
  }
  if (target.shape === 'ellipse' && target.points.length >= 2) {
    const [start, end] = target.points
    return (
      <ellipse
        {...common}
        cx={(start[0] + end[0]) / 2}
        cy={viewY((start[1] + end[1]) / 2)}
        rx={Math.abs(end[0] - start[0]) / 2}
        ry={viewY(Math.abs(end[1] - start[1]) / 2)}
      />
    )
  }
  if (target.shape === 'polygon' && target.points.length >= 3) {
    return <polygon {...common} points={target.points.map((point) => viewPoint(point).join(',')).join(' ')} />
  }
  return null
}

export function CourtCanvas({
  phase,
  className = 'court-diagram',
  interactive = false,
  selected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CanvasProps) {
  const markerSeed = useId().replaceAll(':', '')
  const ballMarker = `ball-arrow-${markerSeed}`
  const movementMarker = `movement-arrow-${markerSeed}`

  return (
    <svg
      aria-label={`コート図: ${phase.label}`}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="img"
      style={interactive ? { touchAction: 'none' } : undefined}
      viewBox={`0 0 100 ${COURT_VIEW_HEIGHT}`}
    >
      <defs>
        <marker id={ballMarker} markerHeight="4.5" markerUnits="userSpaceOnUse" markerWidth="4.5" orient="auto-start-reverse" refX="4" refY="2.5" viewBox="0 0 5 5">
          <path d="M0 0 5 2.5 0 5Z" fill="#facc15" />
        </marker>
        <marker id={movementMarker} markerHeight="4.5" markerUnits="userSpaceOnUse" markerWidth="4.5" orient="auto-start-reverse" refX="4" refY="2.5" viewBox="0 0 5 5">
          <path d="M0 0 5 2.5 0 5Z" fill="#ffffff" />
        </marker>
      </defs>
      <rect fill="#178149" height={viewY(94)} rx="2" width="94" x="3" y={viewY(3)} />
      <g fill="none" stroke="white" strokeWidth="0.8">
        <rect height={viewY(BASELINE_BOTTOM - BASELINE_TOP)} width={DOUBLES_RIGHT - DOUBLES_LEFT} x={DOUBLES_LEFT} y={viewY(BASELINE_TOP)} />
        <path d={`M${SINGLES_LEFT} ${viewY(BASELINE_TOP)}V${viewY(BASELINE_BOTTOM)}M${SINGLES_RIGHT} ${viewY(BASELINE_TOP)}V${viewY(BASELINE_BOTTOM)}M${SINGLES_LEFT} ${viewY(SERVICE_LINE_TOP)}H${SINGLES_RIGHT}M${SINGLES_LEFT} ${viewY(SERVICE_LINE_BOTTOM)}H${SINGLES_RIGHT}M50 ${viewY(SERVICE_LINE_TOP)}V${viewY(SERVICE_LINE_BOTTOM)}`} />
      </g>
      <path d={`M3 ${viewY(50)}H97`} stroke="rgba(15, 23, 42, .72)" strokeWidth="1.6" />

      {phase.targets.map((target, index) => {
        const isSelected = selected?.kind === 'target' && selected.index === index
        const center = targetCenter(target)
        return (
          <g key={`target-${index}`}>
            <TargetShape index={index} selected={isSelected} target={target} />
            {target.label && center ? <text className="court-label" pointerEvents="none" textAnchor="middle" x={center[0]} y={viewY(center[1])}>{target.label}</text> : null}
            {isSelected ? target.points.map(([x, y], pointIndex) => (
              <circle className="court-handle" cx={x} cy={viewY(y)} data-index={index} data-kind="target" data-point-index={pointIndex} key={pointIndex} r="1.3" />
            )) : null}
          </g>
        )
      })}

      {phase.paths.map((path, index) => {
        const isSelected = selected?.kind === 'path' && selected.index === index
        const stroke = path.type === 'ball' ? '#facc15' : '#ffffff'
        return (
          <g key={`path-${index}`}>
            <polyline
              data-index={index}
              data-kind="path"
              fill="none"
              markerEnd={path.showArrow === false ? undefined : `url(#${path.type === 'ball' ? ballMarker : movementMarker})`}
              points={path.points.map((point) => viewPoint(point).join(',')).join(' ')}
              stroke={stroke}
              strokeDasharray={path.type === 'movement' ? '3 2' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isSelected ? 2 : 1.4}
            />
            {path.order && path.points[0] ? (
              <g transform={`translate(${path.points[0][0]} ${viewY(path.points[0][1])})`}>
                <circle fill="#facc15" r="2.5" stroke="#17211b" strokeWidth=".45" />
                <text fill="#17211b" fontSize="3" fontWeight="800" textAnchor="middle" y="1.05">{path.order}</text>
              </g>
            ) : null}
            {isSelected ? path.points.map(([x, y], pointIndex) => (
              <circle className="court-handle" cx={x} cy={viewY(y)} data-index={index} data-kind="path" data-point-index={pointIndex} key={pointIndex} r="1.3" />
            )) : null}
          </g>
        )
      })}

      {phase.actors.map((actor, index) => {
        const isPlayer = actor.role === 'player'
        const isSelected = selected?.kind === 'actor' && selected.index === index
        return (
          <g data-index={index} data-kind="actor" key={actor.id}>
            <circle cx={actor.x} cy={viewY(actor.y)} fill={isPlayer ? '#1565c0' : '#dc2626'} r={isSelected ? 4 : 3.2} stroke="white" strokeWidth="1" />
            <text fill="white" fontSize="3.2" fontWeight="800" pointerEvents="none" textAnchor="middle" x={actor.x} y={viewY(actor.y) + 1.1}>
              {actor.label ?? actor.id.slice(0, 2).toUpperCase()}
            </text>
          </g>
        )
      })}

      {phase.equipment.map((item, index) => {
        const isSelected = selected?.kind === 'equipment' && selected.index === index
        return (
          <g data-index={index} data-kind="equipment" key={`equipment-${index}`}>
            <rect fill="#111827" height={isSelected ? 3.6 : 2.8} rx=".4" stroke={isSelected ? 'white' : undefined} strokeWidth=".6" width={isSelected ? 3.6 : 2.8} x={item.x - (isSelected ? 1.8 : 1.4)} y={viewY(item.y) - (isSelected ? 1.8 : 1.4)} />
            {item.label ? <text className="court-label" textAnchor="middle" x={item.x} y={viewY(item.y) - 2.5}>{item.label}</text> : null}
          </g>
        )
      })}
    </svg>
  )
}

type Props = { diagram: CourtDiagramData }

export function CourtDiagram({ diagram }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const phase = diagram.phases[phaseIndex] ?? diagram.phases[0]
  if (!phase) return null

  return (
    <div className="court-viewer">
      {diagram.phases.length > 1 ? (
        <div aria-label="コート配置のフェーズ" className="court-phase-tabs" role="tablist">
          {diagram.phases.map((item, index) => (
            <button
              aria-selected={phaseIndex === index}
              className={phaseIndex === index ? 'active' : ''}
              key={`${item.label}-${index}`}
              onClick={() => setPhaseIndex(index)}
              role="tab"
              type="button"
            >
              <span>{index + 1}</span>{item.label}
            </button>
          ))}
        </div>
      ) : null}
      <CourtCanvas phase={phase} />
      {phase.description ? <p className="court-phase-description">{phase.description}</p> : null}
    </div>
  )
}
