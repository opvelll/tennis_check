import { useEffect, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { categoryByLabel, catalogIndex, drillById } from '../data/catalog'
import { useNow } from '../hooks/use-now'
import {
  freshnessColor,
  freshnessLabels,
  getFreshnessProgress,
  getFreshnessStatus,
} from '../lib/freshness'
import type { CompletionRecord } from '../store/personal-store'
import { usePersonalStore } from '../store/personal-store'
import type { Drill } from '../types/catalog'
import { Brand } from '../components/brand'
import { FreshnessIndicator } from '../components/freshness-indicator'
import { CheckIcon, ChevronRightIcon, FilterIcon, SettingsIcon } from '../components/icons'
import { SettingsSheet } from '../components/settings-sheet'

type UndoState = {
  drillId: string
  name: string
  previous?: CompletionRecord
}

export function SetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const now = useNow()
  const drillIds = usePersonalStore((state) => state.setup.drillIds)
  const records = usePersonalStore((state) => state.records)
  const settings = usePersonalStore((state) => state.settings)
  const markCompleted = usePersonalStore((state) => state.markCompleted)
  const restoreRecord = usePersonalStore((state) => state.restoreRecord)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [undo, setUndo] = useState<UndoState | null>(null)

  useEffect(() => {
    if (!undo) return
    const timeout = window.setTimeout(() => setUndo(null), 5_000)
    return () => window.clearTimeout(timeout)
  }, [undo])

  const setupDrills = drillIds.flatMap((id) => {
    const drill = drillById.get(id)
    return drill ? [drill] : []
  })

  const visibleDrills = setupDrills.filter((drill) => {
    if (categoryFilter && drill.category[0] !== categoryFilter) return false
    if (!attentionOnly) return true
    const record = records[drill.id]
    const progress = getFreshnessProgress(
      record?.lastCompletedAt,
      settings.defaultFadeDays,
      settings.fadeMultiplier,
      record?.fadeDaysOverride,
      now,
    )
    return progress <= 0
  })

  const groupedDrills = catalogIndex.files.flatMap((category) => {
    const items = visibleDrills.filter((drill) => drill.category[0] === category.label)
    return items.length ? [{ category, items }] : []
  })

  function openDetail(drill: Drill) {
    navigate(`/drills/${drill.id}`, { state: { from: location.pathname } })
  }

  function complete(drill: Drill) {
    setUndo({ drillId: drill.id, name: drill.name, previous: records[drill.id] })
    markCompleted(drill.id)
  }

  return (
    <div className="setup-page">
      <div className="mobile-brand-row">
        <Brand />
        <button aria-label="退色設定を開く" className="icon-button" onClick={() => setSettingsOpen(true)} type="button">
          <SettingsIcon size={26} />
        </button>
      </div>

      <div className="page-title-row">
        <div>
          <h1>今日のセットアップ</h1>
          <p>{setupDrills.length}項目 <span aria-hidden="true">｜</span> {settings.defaultFadeDays}日 × {settings.fadeMultiplier}で退色</p>
        </div>
        <button aria-label="退色設定を開く" className="desktop-settings-button" onClick={() => setSettingsOpen(true)} type="button">
          <SettingsIcon size={20} />
          退色設定
        </button>
      </div>

      <section aria-labelledby="freshness-map-title" className="freshness-map-section">
        <h2 className="sr-only" id="freshness-map-title">セットアップ全体の退色状態</h2>
        <div className="freshness-map">
          {setupDrills.map((drill, index) => {
            const record = records[drill.id]
            const progress = getFreshnessProgress(
              record?.lastCompletedAt,
              settings.defaultFadeDays,
              settings.fadeMultiplier,
              record?.fadeDaysOverride,
              now,
            )
            const categoryColor = categoryByLabel.get(drill.category[0])?.color ?? '#167447'
            const status = getFreshnessStatus(progress, Boolean(record?.lastCompletedAt))
            return (
              <span
                aria-label={`${index + 1}. ${drill.name}: ${freshnessLabels[status]}`}
                className="freshness-cell"
                key={drill.id}
                style={{ backgroundColor: freshnessColor(categoryColor, progress) }}
                title={`${drill.name}: ${freshnessLabels[status]}`}
              >
                {index + 1}
              </span>
            )
          })}
        </div>
        <div className="freshness-legend" aria-label="退色状態の凡例">
          <span><i className="legend-fresh" />実施直後</span>
          <span><i className="legend-fading" />退色中</span>
          <span><i className="legend-expired" />期限経過</span>
        </div>
      </section>

      <div className="setup-toolbar">
        <label className="select-control">
          <FilterIcon size={18} />
          <span className="sr-only">カテゴリ</span>
          <select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
            <option value="">すべてのカテゴリ</option>
            {catalogIndex.files.map((category) => (
              <option key={category.id} value={category.label}>{category.label}</option>
            ))}
          </select>
        </label>
        <button
          aria-pressed={attentionOnly}
          className={attentionOnly ? 'attention-toggle active' : 'attention-toggle'}
          onClick={() => setAttentionOnly((value) => !value)}
          type="button"
        >
          要対応のみ
        </button>
      </div>

      <div className="setup-list">
        {groupedDrills.map(({ category, items }) => (
          <section key={category.id}>
            <div className="category-heading" style={{ '--category-color': category.color } as CSSProperties}>
              <h2>{category.label}</h2>
              <span>{items.length}項目</span>
            </div>
            {items.map((drill) => {
              const record = records[drill.id]
              const progress = getFreshnessProgress(
                record?.lastCompletedAt,
                settings.defaultFadeDays,
                settings.fadeMultiplier,
                record?.fadeDaysOverride,
                now,
              )
              return (
                <article className="setup-row" key={drill.id}>
                  <button
                    aria-label={`${drill.name}を実施済みにする`}
                    className={record?.lastCompletedAt ? 'completion-button completed' : 'completion-button'}
                    onClick={() => complete(drill)}
                    type="button"
                  >
                    {record?.lastCompletedAt ? <CheckIcon size={24} /> : null}
                  </button>
                  <button className="setup-row-body" onClick={() => openDetail(drill)} type="button">
                    <span className="setup-row-index" style={{ color: category.color }}>
                      {setupDrills.indexOf(drill) + 1}
                    </span>
                    <span className="setup-row-copy">
                      <strong>{drill.name}</strong>
                      <small>{drill.cues[0]}</small>
                    </span>
                    <FreshnessIndicator hasCompletion={Boolean(record?.lastCompletedAt)} progress={progress} />
                    <ChevronRightIcon className="row-chevron" size={20} />
                  </button>
                </article>
              )
            })}
          </section>
        ))}
      </div>

      {groupedDrills.length === 0 ? (
        <div className="empty-state">
          <p>条件に合う項目がありません。</p>
          <button onClick={() => { setCategoryFilter(''); setAttentionOnly(false) }} type="button">絞り込みを解除</button>
        </div>
      ) : null}

      {settingsOpen ? <SettingsSheet onClose={() => setSettingsOpen(false)} /> : null}

      {undo ? (
        <div aria-live="polite" className="undo-toast" role="status">
          <span>「{undo.name}」を記録しました</span>
          <button onClick={() => { restoreRecord(undo.drillId, undo.previous); setUndo(null) }} type="button">取り消す</button>
        </div>
      ) : null}
    </div>
  )
}
