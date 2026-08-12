import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { CatalogPage } from './pages/catalog-page'
import { DrillDetailPage } from './pages/drill-detail-page'
import { SetupPage } from './pages/setup-page'

const EditorPage = import.meta.env.DEV ? lazy(() => import('./editor/editor-page')) : undefined

export default function App() {
  return (
    <Routes>
      {EditorPage ? <Route path="editor" element={<Suspense fallback={<div className="editor-loading">エディタを読み込んでいます…</div>}><EditorPage /></Suspense>} /> : null}
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/setup" />} />
        <Route path="setup" element={<SetupPage />} />
        <Route path="drills" element={<CatalogPage />} />
        <Route path="drills/:drillId" element={<DrillDetailPage />} />
        <Route path="*" element={<Navigate replace to="/setup" />} />
      </Route>
    </Routes>
  )
}
