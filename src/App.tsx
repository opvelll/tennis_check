import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/app-shell'
import { CatalogPage } from './pages/catalog-page'
import { DrillDetailPage } from './pages/drill-detail-page'
import { SetupPage } from './pages/setup-page'

export default function App() {
  return (
    <Routes>
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
