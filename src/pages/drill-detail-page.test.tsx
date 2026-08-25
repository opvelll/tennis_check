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

  it('shows the drive-volley reference image with its source and base path', () => {
    render(
      <MemoryRouter initialEntries={['/drills/tech-net-08']}>
        <Routes><Route path="drills/:drillId" element={<DrillDetailPage />} /></Routes>
      </MemoryRouter>,
    )

    const image = screen.getByRole('img', { name: '奥側のベースラインに球出し役、手前側のサービスライン付近に打球者が立つドライブボレー練習' })
    expect(image).toHaveAttribute('src', `${import.meta.env.BASE_URL}images/drills/drive-volley-reference.png`)
    expect(screen.getByRole('heading', { name: '参考画像' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '参考動画を開く' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=b1dU6DYBHvE&t=155s')
    expect(screen.getByText(/ぬいさんぽ\/NUI-SANPO.*2:35付近/)).toBeInTheDocument()
  })
})
