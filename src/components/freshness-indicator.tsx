import { freshnessLabels, getFreshnessStatus } from '../lib/freshness'

type Props = {
  progress: number
  hasCompletion: boolean
}

export function FreshnessIndicator({ progress, hasCompletion }: Props) {
  const status = getFreshnessStatus(progress, hasCompletion)
  const filledDots = status === 'fresh' ? 3 : status === 'fading' ? Math.max(1, Math.ceil(progress * 3)) : 0

  return (
    <span className={`freshness-indicator ${status}`}>
      <span aria-hidden="true" className="freshness-dots">
        {[0, 1, 2].map((dot) => (
          <span className={dot < filledDots ? 'filled' : ''} key={dot} />
        ))}
      </span>
      <span>{freshnessLabels[status]}</span>
    </span>
  )
}
