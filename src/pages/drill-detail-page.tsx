import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CourtDiagram } from '../components/court-diagram'
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, PlusIcon } from '../components/icons'
import { categoryByLabel, drillById, sourceById } from '../data/catalog'
import { displayValue, disciplineLabels, intensityLabels } from '../lib/labels'
import { usePersonalStore } from '../store/personal-store'

type DetailLocationState = { from?: string }

export function DrillDetailPage() {
  const { drillId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const drill = drillById.get(drillId)
  const from = (location.state as DetailLocationState | null)?.from
  const selected = usePersonalStore((state) => state.setup.drillIds.includes(drillId))
  const record = usePersonalStore((state) => state.records[drillId])
  const addDrill = usePersonalStore((state) => state.addDrill)
  const removeDrill = usePersonalStore((state) => state.removeDrill)
  const markCompleted = usePersonalStore((state) => state.markCompleted)
  const setFadeDaysOverride = usePersonalStore((state) => state.setFadeDaysOverride)
  const setPersonalNote = usePersonalStore((state) => state.setPersonalNote)
  const [justCompleted, setJustCompleted] = useState(false)

  function goBack() {
    navigate(from ?? '/drills', { replace: true })
  }

  useEffect(() => {
    if (!justCompleted) return
    const timeout = window.setTimeout(() => setJustCompleted(false), 2_000)
    return () => window.clearTimeout(timeout)
  }, [justCompleted])

  if (!drill) {
    return (
      <article aria-labelledby="missing-drill-title" className="detail-page">
        <div className="detail-topbar">
          <button className="detail-back" onClick={goBack} type="button"><ArrowLeftIcon size={20} />戻る</button>
          <strong>練習の詳細</strong>
          <span aria-hidden="true" />
        </div>
        <div className="missing-drill">
          <h1 id="missing-drill-title">練習が見つかりません</h1>
          <p>項目が削除されたか、URLが正しくない可能性があります。</p>
          <button className="primary-button" onClick={goBack} type="button">練習一覧へ戻る</button>
        </div>
      </article>
    )
  }

  const currentDrill = drill
  const category = categoryByLabel.get(currentDrill.category[0])
  const mediaIds = [...new Set([...currentDrill.media, ...currentDrill.sources])]
  const sources = mediaIds.flatMap((sourceId) => {
    const source = sourceById.get(sourceId)
    return source ? [source] : []
  })
  const playerLabel = currentDrill.playerCount.max && currentDrill.playerCount.max !== currentDrill.playerCount.min
    ? `${currentDrill.playerCount.min}〜${currentDrill.playerCount.max}人`
    : `${currentDrill.playerCount.min}人${currentDrill.playerCount.max ? '' : '〜'}`

  function primaryAction() {
    if (!selected) {
      addDrill(currentDrill.id)
      return
    }
    markCompleted(currentDrill.id)
    setJustCompleted(true)
  }

  return (
    <article aria-labelledby="drill-title" className="detail-page">
      <div className="detail-topbar">
        <button className="detail-back" onClick={goBack} type="button"><ArrowLeftIcon size={20} />戻る</button>
        <strong>練習の詳細</strong>
        <span aria-hidden="true" />
      </div>

      <div className="detail-content">
          <header className="detail-header">
            <p className="detail-breadcrumb" style={{ color: category?.color }}>
              {drill.category.join('　›　')}
            </p>
            <h1 id="drill-title">{drill.name}</h1>
            <p>{drill.summary}</p>
          </header>

          <section className="detail-section">
            <h2>チェックポイント</h2>
            <ul className="cue-list">
              {drill.cues.map((cue) => (
                <li key={cue}><span><CheckIcon size={15} /></span>{cue}</li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h2>条件</h2>
            <dl className="fact-grid">
              <div><dt>人数</dt><dd>{playerLabel}</dd></div>
              <div><dt>環境</dt><dd>{drill.environments.map(displayValue).join('・')}</dd></div>
              <div><dt>時間</dt><dd>{drill.durationMinutes.min}〜{drill.durationMinutes.max}分</dd></div>
              <div><dt>強度</dt><dd>{intensityLabels[drill.intensity]}</dd></div>
              <div><dt>種目</dt><dd>{drill.disciplines.map((value) => disciplineLabels[value]).join('・')}</dd></div>
              <div><dt>形式</dt><dd>{drill.formats.join('・')}</dd></div>
              <div className="wide"><dt>用具</dt><dd>{drill.equipment.map(displayValue).join('・')}</dd></div>
            </dl>
          </section>

          {drill.diagram ? (
            <section className="detail-section">
              <h2>コート配置</h2>
              <CourtDiagram diagram={drill.diagram} />
            </section>
          ) : null}

          {drill.safetyNotes?.length ? (
            <section className="detail-section safety-section">
              <h2>注意点</h2>
              <ul>{drill.safetyNotes.map((note) => <li key={note}>{note}</li>)}</ul>
            </section>
          ) : null}

          <section className="detail-section">
            <h2>参考動画・資料</h2>
            <div className="source-list">
              {sources.map((source) => (
                <a href={source.url} key={source.id} rel="noreferrer" target="_blank">
                  <span><strong>{source.title}</strong><small>{source.organization}・{source.kind}</small></span>
                  <ExternalLinkIcon size={18} />
                </a>
              ))}
            </div>
          </section>

          <section className="detail-section personal-section">
            <h2>自分用設定</h2>
            <label>
              <span>個別の退色日数</span>
              <span className="inline-number-field">
                <input
                  max="30"
                  min="1"
                  onChange={(event) => setFadeDaysOverride(drill.id, event.target.value ? Number(event.target.value) : undefined)}
                  placeholder="全体設定"
                  type="number"
                  value={record?.fadeDaysOverride ?? ''}
                />
                <i>日</i>
              </span>
            </label>
            <label>
              <span>メモ</span>
              <textarea
                defaultValue={record?.personalNote ?? ''}
                key={drill.id}
                onBlur={(event) => setPersonalNote(drill.id, event.target.value.trim())}
                placeholder="次回意識することなど"
                rows={3}
              />
            </label>
          </section>

          <div className="tag-list" aria-label="タグ">
            {drill.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
      </div>

      <div className="detail-actions">
        {selected ? <button className="remove-link" onClick={() => removeDrill(drill.id)} type="button">セットから外す</button> : null}
        <button className="primary-button detail-primary" onClick={primaryAction} type="button">
          {selected ? <CheckIcon size={22} /> : <PlusIcon size={22} />}
          {selected ? (justCompleted ? '記録しました' : '実施済みにする') : 'セットアップに追加'}
        </button>
      </div>
    </article>
  )
}
