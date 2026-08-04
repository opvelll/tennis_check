import { useId } from 'react'
import { useDialogFocus } from '../hooks/use-dialog-focus'
import { usePersonalStore } from '../store/personal-store'
import { CloseIcon } from './icons'

type Props = { onClose: () => void }

const multipliers = [0.5, 1, 1.5, 2] as const

export function SettingsSheet({ onClose }: Props) {
  const titleId = useId()
  const sheetRef = useDialogFocus(onClose)
  const defaultFadeDays = usePersonalStore((state) => state.settings.defaultFadeDays)
  const fadeMultiplier = usePersonalStore((state) => state.settings.fadeMultiplier)
  const setDefaultFadeDays = usePersonalStore((state) => state.setDefaultFadeDays)
  const setFadeMultiplier = usePersonalStore((state) => state.setFadeMultiplier)

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby={titleId} aria-modal="true" className="settings-sheet" ref={sheetRef} role="dialog">
        <div className="sheet-heading">
          <h2 id={titleId}>退色のペース</h2>
          <button aria-label="設定を閉じる" className="icon-button" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </div>

        <div className="settings-section">
          <label className="field-label" htmlFor="default-fade-days">全体の基準日数</label>
          <p className="field-help">実施直後の色が無彩色になるまでの日数です。</p>
          <div className="number-field">
            <input
              id="default-fade-days"
              max="30"
              min="1"
              onChange={(event) => setDefaultFadeDays(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
              type="number"
              value={defaultFadeDays}
            />
            <span>日</span>
          </div>
        </div>

        <div className="settings-section">
          <span className="field-label">全体倍率</span>
          <p className="field-help">すべての項目に同じ倍率をかけます。</p>
          <div className="multiplier-group">
            {multipliers.map((multiplier) => (
              <button
                aria-pressed={fadeMultiplier === multiplier}
                className={fadeMultiplier === multiplier ? 'active' : ''}
                key={multiplier}
                onClick={() => setFadeMultiplier(multiplier)}
                type="button"
              >
                ×{multiplier}
              </button>
            ))}
          </div>
        </div>

        <button className="primary-button" onClick={onClose} type="button">完了</button>
      </section>
    </div>
  )
}
