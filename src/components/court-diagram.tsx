import type { CourtDiagram as CourtDiagramData } from '../types/catalog'

type Props = {
  diagram: CourtDiagramData
  phaseIndex?: number
}

export function CourtDiagram({ diagram, phaseIndex = 0 }: Props) {
  const phase = diagram.phases[phaseIndex]
  if (!phase) return null

  return (
    <svg
      aria-label={`コート図: ${phase.label}`}
      className="court-diagram"
      role="img"
      viewBox="0 0 100 100"
    >
      <rect fill="#178149" height="94" rx="2" width="72" x="14" y="3" />
      <g fill="none" stroke="white" strokeWidth="0.8">
        <rect height="86" width="64" x="18" y="7" />
        <path d="M18 50h64M26 7v86M74 7v86M26 28h48M26 72h48M50 28v44" />
      </g>
      {phase.targets.map((target, index) => {
        if (target.shape !== 'rect' || target.points.length < 2) return null
        const [start, end] = target.points
        return (
          <rect
            fill="rgba(250, 204, 21, .45)"
            height={Math.abs(end[1] - start[1])}
            key={`target-${index}`}
            stroke="#facc15"
            width={Math.abs(end[0] - start[0])}
            x={Math.min(start[0], end[0])}
            y={Math.min(start[1], end[1])}
          />
        )
      })}
      {phase.paths.map((path, index) => (
        <polyline
          fill="none"
          key={`path-${index}`}
          points={path.points.map(([x, y]) => `${x},${y}`).join(' ')}
          stroke={path.type === 'ball' ? '#facc15' : '#ffffff'}
          strokeDasharray={path.type === 'movement' ? '3 2' : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      ))}
      {phase.actors.map((actor) => (
        <g key={actor.id}>
          <circle
            cx={actor.x}
            cy={actor.y}
            fill={actor.role === 'player' ? '#1565c0' : '#dc2626'}
            r="3.2"
            stroke="white"
            strokeWidth="1"
          />
        </g>
      ))}
      {phase.equipment.map((item, index) => (
        <rect fill="#111827" height="2.5" key={`equipment-${index}`} width="2.5" x={item.x - 1.25} y={item.y - 1.25} />
      ))}
    </svg>
  )
}
