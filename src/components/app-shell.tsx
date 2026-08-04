import { NavLink, Outlet } from 'react-router-dom'
import { Brand } from './brand'
import { ClipboardIcon, ListIcon } from './icons'

const navigation = [
  { to: '/setup', label: 'セットアップ', Icon: ClipboardIcon },
  { to: '/drills', label: '練習一覧', Icon: ListIcon },
]

export function AppShell() {
  return (
    <div className="min-h-dvh bg-white text-slate-950">
      <header className="desktop-header">
        <Brand />
        <nav aria-label="メインナビゲーション" className="desktop-nav">
          {navigation.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'desktop-nav-link active' : 'desktop-nav-link'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav aria-label="メインナビゲーション" className="bottom-nav">
        {navigation.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'bottom-nav-link active' : 'bottom-nav-link'}>
            <Icon size={24} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
