import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_DRILL_IDS, usePersonalStore } from '../store/personal-store'
import { SetupPage } from './setup-page'

describe('SetupPage', () => {
  beforeEach(() => {
    usePersonalStore.setState((state) => ({
      ...state,
      setup: { id: 'singles-default', name: '標準セット', drillIds: [...DEFAULT_DRILL_IDS] },
      records: {},
      settings: { defaultFadeDays: 3, fadeMultiplier: 1 },
    }))
  })

  it('shows the map and records a completion independently from row navigation', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><SetupPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: '今日のセットアップ' })).toBeInTheDocument()
    expect(screen.getByText('30項目', { exact: false })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ミニラリー・コンタクトウィンドウを実施済みにする' }))

    expect(usePersonalStore.getState().records['tech-fh-01']?.completedCount).toBe(1)
    expect(screen.getByText('「ミニラリー・コンタクトウィンドウ」を記録しました')).toBeInTheDocument()
  })
})
