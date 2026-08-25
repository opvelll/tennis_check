import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CourtEditor } from './court-editor'
import { emptyPhase } from './editor-helpers'

describe('CourtEditor', () => {
  it('keeps the editing legend available with the official-ratio canvas', () => {
    const { container } = render(<CourtEditor onChange={vi.fn()} phase={emptyPhase()} />)

    expect(screen.getByRole('heading', { name: '凡例' })).toBeInTheDocument()
    expect(screen.getByText('相手・球出し')).toBeInTheDocument()
    expect(container.querySelector('.editor-court-canvas')).toHaveAttribute('viewBox', '0 0 100 216.68')
  })

  it('maps pointer dragging back to the unchanged 0-100 data coordinates', () => {
    const onChange = vi.fn()
    const phase = {
      ...emptyPhase(),
      actors: [{ id: 'p1', role: 'player' as const, label: '打', x: 58, y: 71 }],
    }
    const { container } = render(<CourtEditor onChange={onChange} phase={phase} />)
    const canvas = container.querySelector<SVGSVGElement>('.editor-court-canvas')!
    const actor = canvas.querySelector<SVGGElement>('[data-kind="actor"]')!

    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      bottom: 713.38,
      height: 693.38,
      left: 10,
      right: 330,
      top: 20,
      width: 320,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    })
    canvas.setPointerCapture = vi.fn()
    canvas.releasePointerCapture = vi.fn()

    fireEvent.pointerDown(actor, { clientX: 195.6, clientY: 512.3, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 266, clientY: 158.68, pointerId: 1 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      actors: [expect.objectContaining({ x: 80, y: 20 })],
    }))
  })
})
