import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CourtDiagram } from './court-diagram'
import type { CourtDiagram as Diagram } from '../types/catalog'

const diagram: Diagram = {
  orientation: 'vertical',
  phases: [
    { label: '開始配置', description: '最初の位置', actors: [{ id: 'p1', role: 'player', label: 'A', x: 50, y: 80 }], equipment: [], paths: [], targets: [{ shape: 'ellipse', points: [[20, 10], [40, 30]], label: '狙い' }] },
    { label: '展開', description: '次の位置', actors: [{ id: 'o1', role: 'opponent', x: 50, y: 20 }], equipment: [], paths: [{ type: 'ball', points: [[50, 80], [50, 20]], order: 1 }], targets: [{ shape: 'polygon', points: [[10, 10], [20, 20], [5, 20]] }] },
  ],
}

describe('CourtDiagram', () => {
  it('switches phases and renders all supported SVG primitives', async () => {
    const user = userEvent.setup()
    const { container } = render(<CourtDiagram diagram={diagram} />)
    expect(screen.getByRole('img', { name: 'コート図: 開始配置' })).toBeInTheDocument()
    expect(container.querySelector('ellipse')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /展開/ }))
    expect(screen.getByRole('img', { name: 'コート図: 展開' })).toBeInTheDocument()
    expect(screen.getByText('次の位置')).toBeInTheDocument()
    expect(container.querySelector('polygon')).toBeInTheDocument()
    expect(container.querySelector('polyline')).toBeInTheDocument()
  })
})
