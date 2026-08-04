import { useDeferredValue, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Brand } from '../components/brand'
import { CheckIcon, ChevronRightIcon, FilterIcon, PlusIcon, SearchIcon } from '../components/icons'
import { catalogFacets, categoryByLabel, drills } from '../data/catalog'
import { emptyFilters, filterDrills, type DrillFilters } from '../lib/filter-drills'
import { displayValue, intensityLabels } from '../lib/labels'
import { usePersonalStore } from '../store/personal-store'
import type { Drill } from '../types/catalog'

export function CatalogPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const selectedIds = usePersonalStore((state) => state.setup.drillIds)
  const addDrill = usePersonalStore((state) => state.addDrill)
  const removeDrill = usePersonalStore((state) => state.removeDrill)
  const [filters, setFilters] = useState<DrillFilters>(emptyFilters)
  const deferredQuery = useDeferredValue(filters.query)
  const selectedSet = new Set(selectedIds)
  const results = filterDrills(drills, { ...filters, query: deferredQuery })
  const hasFilters = Object.entries(filters).some(([, value]) => value !== '' && value !== null)

  function setFilter<Key extends keyof DrillFilters>(key: Key, value: DrillFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function openDetail(drill: Drill) {
    navigate(`/drills/${drill.id}`, { state: { from: location.pathname } })
  }

  return (
    <div className="catalog-page">
      <div className="mobile-brand-row catalog-brand-row">
        <Brand />
        <strong>練習一覧</strong>
      </div>

      <div className="catalog-heading">
        <h1>練習一覧</h1>
        <p>条件に合う練習を探して、標準セットへ追加できます。</p>
      </div>

      <div className="catalog-controls">
        <label className="search-field">
          <SearchIcon size={22} />
          <span className="sr-only">練習を検索</span>
          <input
            onChange={(event) => setFilter('query', event.target.value)}
            placeholder="練習名・目的・タグを検索"
            type="search"
            value={filters.query}
          />
        </label>

        <div aria-label="練習の絞り込み" className="filter-strip">
          <span className="filter-strip-label"><FilterIcon size={17} />条件</span>
          <select aria-label="種目" onChange={(event) => setFilter('discipline', event.target.value as DrillFilters['discipline'])} value={filters.discipline}>
            <option value="">種目</option>
            <option value="singles">シングルス</option>
            <option value="doubles">ダブルス</option>
            <option value="both">共通</option>
          </select>
          <select aria-label="カテゴリ" onChange={(event) => setFilter('category', event.target.value)} value={filters.category}>
            <option value="">カテゴリ</option>
            {catalogFacets.categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select aria-label="形式" onChange={(event) => setFilter('format', event.target.value)} value={filters.format}>
            <option value="">形式</option>
            {catalogFacets.formats.map((format) => <option key={format} value={format}>{format}</option>)}
          </select>
          <select aria-label="人数" onChange={(event) => setFilter('playerCount', event.target.value ? Number(event.target.value) : null)} value={filters.playerCount ?? ''}>
            <option value="">人数</option>
            {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}人</option>)}
          </select>
          <select aria-label="環境" onChange={(event) => setFilter('environment', event.target.value)} value={filters.environment}>
            <option value="">環境</option>
            {catalogFacets.environments.map((environment) => <option key={environment} value={environment}>{displayValue(environment)}</option>)}
          </select>
          <select aria-label="強度" onChange={(event) => setFilter('intensity', event.target.value as DrillFilters['intensity'])} value={filters.intensity}>
            <option value="">強度</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
          <select aria-label="最大時間" onChange={(event) => setFilter('maxDuration', event.target.value ? Number(event.target.value) : null)} value={filters.maxDuration ?? ''}>
            <option value="">時間</option>
            <option value="10">10分以内</option>
            <option value="15">15分以内</option>
            <option value="20">20分以内</option>
            <option value="30">30分以内</option>
          </select>
        </div>
      </div>

      <div className="catalog-result-bar">
        <span><strong>{results.length}</strong>件</span>
        {hasFilters ? <button onClick={() => setFilters(emptyFilters)} type="button">条件をクリア</button> : null}
      </div>

      <div className="catalog-list">
        {results.map((drill) => {
          const category = categoryByLabel.get(drill.category[0])
          const selected = selectedSet.has(drill.id)
          return (
            <article className="catalog-row long-list-item" key={drill.id}>
              <button className="catalog-row-body" onClick={() => openDetail(drill)} type="button">
                <span className="catalog-category" style={{ color: category?.color }}>
                  <i style={{ backgroundColor: category?.color }} />
                  {drill.category[1]}
                </span>
                <strong>{drill.name}</strong>
                <span className="catalog-summary">{drill.summary}</span>
                <span className="catalog-facts">
                  {drill.playerCount.min}人〜 <i /> {displayValue(drill.environments[0])} <i /> {drill.durationMinutes.min}–{drill.durationMinutes.max}分 <i /> 強度{intensityLabels[drill.intensity]}
                </span>
              </button>
              <button
                aria-label={selected ? `${drill.name}を標準セットから外す` : `${drill.name}を標準セットへ追加`}
                className={selected ? 'catalog-add-button selected' : 'catalog-add-button'}
                onClick={() => selected ? removeDrill(drill.id) : addDrill(drill.id)}
                type="button"
              >
                {selected ? <CheckIcon size={24} /> : <PlusIcon size={24} />}
                <span>{selected ? '追加済み' : '追加'}</span>
              </button>
              <ChevronRightIcon className="catalog-chevron" size={20} />
            </article>
          )
        })}
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <p>条件に合う練習がありません。</p>
          <button onClick={() => setFilters(emptyFilters)} type="button">条件をクリア</button>
        </div>
      ) : null}
    </div>
  )
}
