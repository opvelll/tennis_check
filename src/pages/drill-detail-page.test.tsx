import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DrillDetailPage } from './drill-detail-page'

describe('DrillDetailPage', () => {
  it('renders as a normal page and returns to the originating page', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={[{ pathname: '/drills/tech-fh-05', state: { from: '/drills' } }]}>
        <Routes>
          <Route path="drills/:drillId" element={<DrillDetailPage />} />
          <Route path="drills" element={<h1>練習一覧</h1>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('article', { name: '高弾道フォア・肩上攻撃' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '戻る' }))

    expect(screen.getByRole('heading', { name: '練習一覧' })).toBeInTheDocument()
  })
})
